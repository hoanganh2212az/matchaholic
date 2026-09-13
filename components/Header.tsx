export function Header() {
  return (
    <nav className="topbar" aria-label="Primary navigation">
      <a className="brand" href="#menu" aria-label="Matcha.holic menu">
        <span>matcha.holic</span>
      </a>
      <div className="nav-actions">
        <a href="#drinks">Đồ uống</a>
        <a href="#pastries">Bánh ngọt</a>
        <a href="#coffee">Cà phê</a>
        <a href="#order">Giỏ hàng</a>
      </div>
    </nav>
  );
}
