import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero__badge">실시간 금융 송금 시스템</div>
        <h1 className="landing-hero__title">
          빠르고 안전한<br />송금, Quick Transfer
        </h1>
        <p className="landing-hero__desc">
          마이크로서비스 아키텍처 기반의 실시간 송금 플랫폼.<br />
          Kafka Saga 패턴으로 안정적인 트랜잭션을 보장합니다.
        </p>
        <Link to="/dashboard" className="btn btn-primary landing-hero__cta">
          시작하기
        </Link>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-feature">
          <div className="landing-feature__icon icon-circle icon-circle--primary">
            <span className="css-icon icon-send" />
          </div>
          <h3 className="landing-feature__title">실시간 송금</h3>
          <p className="landing-feature__desc">
            Kafka 이벤트 기반 비동기 처리로<br />빠르고 안정적인 송금
          </p>
        </div>

        <div className="landing-feature">
          <div className="landing-feature__icon icon-circle icon-circle--success">
            <span className="css-icon icon-check" />
          </div>
          <h3 className="landing-feature__title">안전한 트랜잭션</h3>
          <p className="landing-feature__desc">
            Saga 보상 트랜잭션으로<br />실패 시 자동 롤백 보장
          </p>
        </div>

        <div className="landing-feature">
          <div className="landing-feature__icon icon-circle icon-circle--warning">
            <span className="css-icon icon-clock" />
          </div>
          <h3 className="landing-feature__title">실시간 알림</h3>
          <p className="landing-feature__desc">
            SSE 기반 실시간 푸시 알림으로<br />송금 상태를 즉시 확인
          </p>
        </div>
      </section>

      {/* Architecture */}
      <section className="landing-arch">
        <h2 className="landing-arch__title">시스템 아키텍처</h2>
        <div className="landing-arch__flow">
          <div className="landing-arch__node">
            <div className="landing-arch__node-icon icon-circle icon-circle--primary">
              <span className="css-icon icon-bank" />
            </div>
            <span className="landing-arch__node-label">Account</span>
            <span className="landing-arch__node-port">:8081</span>
          </div>
          <div className="landing-arch__arrow">
            <span className="css-icon icon-arrow-down" style={{ transform: 'rotate(-90deg)' }} />
          </div>
          <div className="landing-arch__node landing-arch__node--kafka">
            <div className="landing-arch__node-label">Kafka</div>
            <span className="landing-arch__node-port">Event Bus</span>
          </div>
          <div className="landing-arch__arrow">
            <span className="css-icon icon-arrow-down" style={{ transform: 'rotate(-90deg)' }} />
          </div>
          <div className="landing-arch__node">
            <div className="landing-arch__node-icon icon-circle icon-circle--success">
              <span className="css-icon icon-send" />
            </div>
            <span className="landing-arch__node-label">Transfer</span>
            <span className="landing-arch__node-port">:8082</span>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="landing-stack">
        <h2 className="landing-stack__title">기술 스택</h2>
        <div className="landing-stack__grid">
          {[
            { label: 'Java 21', category: 'Backend' },
            { label: 'Spring Boot 3.4', category: 'Backend' },
            { label: 'Spring Kafka', category: 'Messaging' },
            { label: 'MySQL 8', category: 'Database' },
            { label: 'Redis', category: 'Cache' },
            { label: 'React 18', category: 'Frontend' },
            { label: 'TypeScript', category: 'Frontend' },
            { label: 'Docker', category: 'Infra' },
          ].map(tech => (
            <div className="landing-stack__item" key={tech.label}>
              <span className="landing-stack__label">{tech.label}</span>
              <span className="landing-stack__category">{tech.category}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <h2 className="landing-cta__title">지금 시작하세요</h2>
        <p className="landing-cta__desc">계좌를 개설하고 실시간 송금을 경험해보세요</p>
        <Link to="/dashboard" className="btn btn-primary landing-hero__cta">
          대시보드로 이동
        </Link>
      </section>
    </div>
  )
}

export default LandingPage
