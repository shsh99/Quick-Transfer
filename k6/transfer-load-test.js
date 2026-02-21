import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const transferSuccess = new Counter('transfer_success');
const transferFail = new Counter('transfer_fail');
const transferDuration = new Trend('transfer_duration');

const BASE_URL = __ENV.BASE_URL || 'http://localhost';

const ACCOUNT_API = `${BASE_URL}:8081/api/accounts`;
const TRANSFER_API = `${BASE_URL}:8082/api/transfers`;

export const options = {
  scenarios: {
    // 1단계: 워밍업
    warmup: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      startTime: '0s',
      tags: { phase: 'warmup' },
    },
    // 2단계: 부하 증가
    rampup: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      startTime: '30s',
      tags: { phase: 'load' },
    },
    // 3단계: 스파이크 테스트
    spike: {
      executor: 'constant-vus',
      vus: 200,
      duration: '30s',
      startTime: '3m30s',
      tags: { phase: 'spike' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
    transfer_success: ['count>0'],
  },
};

// 테스트 전 계좌 2개 생성
export function setup() {
  const sender = http.post(ACCOUNT_API, JSON.stringify({ ownerName: '송금자' }), {
    headers: { 'Content-Type': 'application/json' },
  });
  const receiver = http.post(ACCOUNT_API, JSON.stringify({ ownerName: '수취인' }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const senderAccount = JSON.parse(sender.body).data.accountNumber;
  const receiverAccount = JSON.parse(receiver.body).data.accountNumber;

  console.log(`송금계좌: ${senderAccount}, 수취계좌: ${receiverAccount}`);
  return { senderAccount, receiverAccount };
}

export default function (data) {
  const payload = JSON.stringify({
    senderAccount: data.senderAccount,
    receiverAccount: data.receiverAccount,
    amount: Math.floor(Math.random() * 1000) + 100,
  });

  const start = Date.now();
  const res = http.post(TRANSFER_API, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  const duration = Date.now() - start;

  transferDuration.add(duration);

  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    'response has transferId': (r) => {
      const body = JSON.parse(r.body);
      return body.success && body.data && body.data.transferId;
    },
  });

  if (success) {
    transferSuccess.add(1);
  } else {
    transferFail.add(1);
  }

  sleep(0.1);
}
