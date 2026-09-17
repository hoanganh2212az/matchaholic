"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  confirmOrderAndAwardPoints,
  formatPhoneDisplay,
  getAllCustomers,
  getLoyaltyTransactions,
  getManagerSession,
  getOrders,
  loginManager,
  logoutManager,
  manualAdjustPoints,
  SUPABASE_SQL_SCHEMA,
  updateOrderStatus,
} from "../../lib/supabase";
import type {
  OrderRecord,
  OrderStatus,
  UserProfile,
} from "../../types/loyalty";

import { money } from "../../lib/formatters";

export default function ManagerPortal() {
  const [session, setSession] = useState<any>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    setSession(getManagerSession());
    
    // Fetch data if logged in
    const sess = getManagerSession();
    if (sess) {
      Promise.all([
        getOrders(),
        getAllCustomers(),
        getLoyaltyTransactions()
      ]).then(([o, c, t]) => {
        setOrders(o);
        setCustomers(c);
        setTransactions(t);
      });
    }
  }, []);

  const [emailInput, setEmailInput] = useState("manager@matchaholic.vn");
  const [passwordInput, setPasswordInput] = useState("matcha123");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<"orders" | "customers" | "sql">("orders");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal for manual point adjustment
  const [adjustCustomer, setAdjustCustomer] = useState<UserProfile | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>("Tặng điểm khách thân thiết");


  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    const res = await loginManager(emailInput, passwordInput);
    setLoginLoading(false);

    if (!res.success) {
      setLoginError(res.message || "Đăng nhập thất bại");
    } else {
      window.location.reload();
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmailInput("manager@matchaholic.vn");
    setPasswordInput("matcha123");
    setLoginLoading(true);
    await loginManager("demo", "admin");
    window.location.reload();
  };

  const handleLogout = () => {
    logoutManager();
    window.location.reload();
  };


  const handleConfirmOrder = async (order: OrderRecord) => {
    const drinkCount = order.items
      .filter((it) => it.category === "matcha" || it.category === "coffee")
      .reduce((sum, it) => sum + it.quantity, 0);

    const pointsToGive = Math.max(1, drinkCount > 0 ? drinkCount : 1);

    const res = await confirmOrderAndAwardPoints(order.id, pointsToGive);
    if (res.success) {
      showNotification("success", res.message);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showNotification("error", res.message);
    }
  };

  const handleManualPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustCustomer) return;

    const res = await manualAdjustPoints(adjustCustomer.id, adjustDelta, adjustReason);
    if (res.success) {
      showNotification(
        "success",
        `Đã điều chỉnh ${adjustDelta > 0 ? `+${adjustDelta}` : adjustDelta} điểm cho khách hàng ${adjustCustomer.name}. Số dư mới: ${res.newBalance} điểm.`,
      );
      setAdjustCustomer(null);
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        order.orderCode.toLowerCase().includes(q) ||
        order.customerPhone.includes(q) ||
        order.customerName.toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, searchQuery]);

  // Summary statistics
  const stats = useMemo(() => {
    const pendingCount = orders.filter((o) => o.status === "pending").length;
    const confirmedCount = orders.filter((o) => o.status === "confirmed").length;
    const totalRevenue = orders
      .filter((o) => o.status === "confirmed" || o.status === "completed")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPointsGiven = orders.reduce((sum, o) => sum + o.pointsAwarded, 0);

    return {
      pendingCount,
      confirmedCount,
      totalRevenue,
      totalPointsGiven,
      customerCount: customers.length,
    };
  }, [orders, customers]);

  // LOGIN SCREEN FOR MANAGER
  if (!session) {
    return (
      <main className="manager-login-shell">
        <div className="manager-login-card">
          <div className="manager-login-header">
            <span className="manager-badge-pill">Cổng Nhân Viên & CSKH</span>
            <h1>Matchaholic Manager</h1>
            <p>Đăng nhập để xác nhận đơn khách gửi qua Facebook Messenger và tích điểm thưởng.</p>
          </div>

          {loginError ? <div className="auth-error-box">{loginError}</div> : null}

          <form onSubmit={handleLogin} className="manager-login-form">
            <label className="auth-field">
              <span>Email quản lý</span>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="manager@matchaholic.vn"
                required
              />
            </label>

            <label className="auth-field">
              <span>Mật khẩu</span>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            <button
              type="submit"
              className="manager-submit-btn"
              disabled={loginLoading}
            >
              {loginLoading ? "Đang kiểm tra..." : "Đăng nhập Quản lý →"}
            </button>

            <div className="manager-quick-demo">
              <span>Hoặc thử nghiệm ngay:</span>
              <button
                type="button"
                className="manager-demo-btn"
                onClick={handleQuickDemoLogin}
              >
                ⚡ Đăng nhập nhanh bằng tài khoản Demo (1-Click)
              </button>
            </div>
          </form>

          <div className="manager-login-footer">
            <Link href="/" className="back-to-menu-link">
              ← Quay lại trang Menu khách hàng
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // LOGGED IN DASHBOARD
  return (
    <main className="manager-dashboard-shell">
      {/* Top navbar */}
      <header className="manager-topbar">
        <div className="manager-topbar-brand">
          <Link href="/" className="manager-brand-logo">
            matcha.holic
          </Link>
          <span className="manager-brand-role">Customer Service & Loyalty Manager</span>
        </div>

        <div className="manager-topbar-actions">
          <span className="manager-user-info">
            👤 <b>{session.email}</b>
          </span>
          <Link href="/" className="manager-client-view-link">
            🍵 Xem Menu khách
          </Link>
          <button
            type="button"
            className="manager-logout-btn"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Floating notification banner */}
      {notification ? (
        <div className={`manager-alert-banner ${notification.type}`}>
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="banner-close-btn"
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className="manager-container">
        {/* KPI Stats Row */}
        <div className="manager-kpi-grid">
          <div className="kpi-card pending-card">
            <span className="kpi-label">Đơn chờ duyệt (Facebook)</span>
            <strong className="kpi-value">{stats.pendingCount}</strong>
            <small>Cần xác nhận và tích điểm</small>
          </div>
          <div className="kpi-card confirmed-card">
            <span className="kpi-label">Đơn đã xác nhận</span>
            <strong className="kpi-value">{stats.confirmedCount}</strong>
            <small>Đã duyệt thành công</small>
          </div>
          <div className="kpi-card points-card">
            <span className="kpi-label">Tổng điểm đã thưởng</span>
            <strong className="kpi-value">{stats.totalPointsGiven} ⭐</strong>
            <small>Khách hàng tích lũy</small>
          </div>
          <div className="kpi-card customers-card">
            <span className="kpi-label">Khách hàng thành viên</span>
            <strong className="kpi-value">{stats.customerCount}</strong>
            <small>Đăng ký qua SĐT</small>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="manager-tabs-bar">
          <div className="manager-tabs-left">
            <button
              type="button"
              className={`manager-tab-btn ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              📋 Danh sách Đơn hàng ({orders.length})
            </button>
            <button
              type="button"
              className={`manager-tab-btn ${activeTab === "customers" ? "active" : ""}`}
              onClick={() => setActiveTab("customers")}
            >
              👥 Danh bạ Khách hàng ({customers.length})
            </button>
            <button
              type="button"
              className={`manager-tab-btn ${activeTab === "sql" ? "active" : ""}`}
              onClick={() => setActiveTab("sql")}
            >
              ⚙️ Supabase SQL Schema
            </button>
          </div>
        </div>

        {/* TAB 1: ORDERS QUEUE */}
        {activeTab === "orders" ? (
          <section className="manager-orders-section">
            <div className="orders-toolbar">
              <div className="status-filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === "all" ? "active" : ""}`}
                  onClick={() => setStatusFilter("all")}
                >
                  Tất cả ({orders.length})
                </button>
                <button
                  type="button"
                  className={`filter-pill pending-pill ${statusFilter === "pending" ? "active" : ""}`}
                  onClick={() => setStatusFilter("pending")}
                >
                  ⏳ Chờ xác nhận ({orders.filter((o) => o.status === "pending").length})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === "confirmed" ? "active" : ""}`}
                  onClick={() => setStatusFilter("confirmed")}
                >
                  ✓ Đã duyệt ({orders.filter((o) => o.status === "confirmed").length})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === "completed" ? "active" : ""}`}
                  onClick={() => setStatusFilter("completed")}
                >
                  Hoàn thành ({orders.filter((o) => o.status === "completed").length})
                </button>
              </div>

              <div className="orders-search-box">
                <input
                  type="search"
                  placeholder="Tìm theo mã đơn (#MH-...), SĐT, tên khách..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="manager-empty-state">
                <p>Không có đơn hàng nào phù hợp với bộ lọc.</p>
                <small>Khách đặt món qua Menu sẽ tự động xuất hiện ở đây.</small>
              </div>
            ) : (
              <div className="orders-grid">
                {filteredOrders.map((order) => {
                  const drinkCount = order.items
                    .filter((it) => it.category === "matcha" || it.category === "coffee")
                    .reduce((sum, it) => sum + it.quantity, 0);
                  const suggestedPoints = Math.max(1, drinkCount > 0 ? drinkCount : 1);

                  return (
                    <article
                      key={order.id}
                      className={`order-card ${order.status === "pending" ? "pending-card-border" : ""}`}
                    >
                      <div className="order-card-header">
                        <div className="order-code-block">
                          <span className="order-code-badge">#{order.orderCode}</span>
                          <span className="order-time">
                            {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className={`status-tag status-${order.status}`}>
                          {order.status === "pending"
                            ? "⏳ Chờ duyệt"
                            : order.status === "confirmed"
                            ? "✓ Đã xác nhận & Tích điểm"
                            : order.status}
                        </span>
                      </div>

                      {/* Customer contact */}
                      <div className="order-customer-box">
                        <div>
                          <strong>{order.customerName}</strong>
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="order-phone-link"
                          >
                            📞 {formatPhoneDisplay(order.customerPhone)}
                          </a>
                        </div>
                        <span className="fulfillment-tag">
                          {order.fulfillment === "Pickup" ? "Mang đi (Pickup)" : "Giao hàng (Delivery)"}
                        </span>
                      </div>

                      {order.address ? (
                        <div className="order-address-box">
                          <b>Địa chỉ:</b> {order.address}
                        </div>
                      ) : null}

                      {order.note ? (
                        <div className="order-note-box">
                          <b>Ghi chú khách:</b> {order.note}
                        </div>
                      ) : null}

                      {/* Order items list */}
                      <div className="order-items-table">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="order-item-row">
                            <div className="item-main">
                              <span className="item-qty">{item.quantity}x</span>
                              <span className="item-name">{item.name}</span>
                              {item.size ? <span className="item-size">Size {item.size}</span> : null}
                            </div>
                            <div className="item-customs">
                              {[
                                item.matcha,
                                item.sweetness,
                                item.ice,
                                ...item.extras.map((e) => `+${e.name}`),
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="order-footer-row">
                        <div className="order-total-block">
                          <span>Tổng cộng</span>
                          <strong>{money(order.totalAmount)}</strong>
                        </div>

                        {order.status === "pending" ? (
                          <div className="order-action-buttons">
                            <button
                              type="button"
                              className="confirm-award-btn"
                              onClick={() => handleConfirmOrder(order)}
                              title={`Xác nhận đơn và tích +${suggestedPoints} điểm cho khách`}
                            >
                              ⭐ Xác nhận & Tích +{suggestedPoints} Điểm
                            </button>
                          </div>
                        ) : (
                          <div className="order-confirmed-summary">
                            <span>
                              Đã tích <b>+{order.pointsAwarded} ⭐</b>
                            </span>
                            {order.status === "confirmed" ? (
                              <button
                                type="button"
                                className="complete-btn"
                                onClick={() => updateOrderStatus(order.id, "completed")}
                              >
                                Đánh dấu Hoàn tất
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {/* TAB 2: CUSTOMERS DIRECTORY */}
        {activeTab === "customers" ? (
          <section className="manager-customers-section">
            <div className="section-intro">
              <h2>Danh bạ Khách hàng & Điểm thưởng</h2>
              <p>Khách hàng được nhận diện theo số điện thoại đã xác thực hoặc ghi nhận từ đơn hàng.</p>
            </div>

            <div className="customers-table-wrapper">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Số điện thoại</th>
                    <th>Điểm tích lũy ⭐</th>
                    <th>Lần đặt gần nhất</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name || "Khách hàng"}</strong>
                        <br />
                        <small className="member-status">
                          {c.loyaltyPoints >= 20
                            ? "👑 Matcha Master"
                            : c.loyaltyPoints >= 10
                            ? "🌿 Matcha Lover"
                            : "Thành viên mới"}
                        </small>
                      </td>
                      <td>
                        <span className="phone-mono">
                          {formatPhoneDisplay(c.phone)}
                        </span>
                      </td>
                      <td>
                        <span className="customer-points-pill">
                          ⭐ <b>{c.loyaltyPoints}</b> điểm
                        </span>
                      </td>
                      <td>
                        {c.lastOrderAt
                          ? new Date(c.lastOrderAt).toLocaleDateString("vi-VN")
                          : "Chưa có"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="adjust-points-btn"
                          onClick={() => {
                            setAdjustCustomer(c);
                            setAdjustDelta(1);
                            setAdjustReason("Tặng điểm chăm sóc khách hàng");
                          }}
                        >
                          Cộng / Trừ điểm
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Audit Transactions History */}
            <div className="audit-section">
              <h3>Nhật ký giao dịch Tích & Đổi điểm gần đây</h3>
              <div className="audit-list">
                {transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="audit-row">
                    <div>
                      <strong>{tx.reason}</strong>
                      <small>{new Date(tx.createdAt).toLocaleString("vi-VN")}</small>
                    </div>
                    <span className={tx.pointsChange >= 0 ? "points-gain" : "points-loss"}>
                      {tx.pointsChange >= 0 ? `+${tx.pointsChange}` : tx.pointsChange} ⭐
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* TAB 3: SUPABASE SQL SCHEMA */}
        {activeTab === "sql" ? (
          <section className="manager-sql-section">
            <div className="sql-instructions">
              <h2>Hướng dẫn triển khai lên Supabase thực tế</h2>
              <p>
                Khi bạn sẵn sàng chuyển từ Mock sang Supabase thật, chỉ cần mở{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Supabase Dashboard
                </a>
                , vào tab <b>SQL Editor</b>, dán đoạn mã bên dưới và nhấn <b>Run</b>:
              </p>
            </div>

            <div className="sql-box-container">
              <pre className="sql-code-block">{SUPABASE_SQL_SCHEMA}</pre>
            </div>
          </section>
        ) : null}
      </div>

      {/* Manual Point Adjustment Modal */}
      {adjustCustomer ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="adjust-modal-card">
            <button
              className="modal-close-btn"
              onClick={() => setAdjustCustomer(null)}
              type="button"
            >
              ✕
            </button>

            <h3>Điều chỉnh điểm cho khách hàng</h3>
            <p>
              Khách hàng: <b>{adjustCustomer.name}</b> ({formatPhoneDisplay(adjustCustomer.phone)})
            </p>
            <p>
              Số dư hiện tại: <b>{adjustCustomer.loyaltyPoints}</b> điểm
            </p>

            <form onSubmit={handleManualPointsSubmit} className="adjust-form">
              <label className="auth-field">
                <span>Số điểm cần cộng (+) hoặc trừ (-)</span>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  required
                />
              </label>

              <label className="auth-field">
                <span>Lý do điều chỉnh</span>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ví dụ: Bù lỗi giao chậm, Thưởng sinh nhật..."
                  required
                />
              </label>

              <button type="submit" className="auth-submit-btn">
                Lưu thay đổi điểm
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
