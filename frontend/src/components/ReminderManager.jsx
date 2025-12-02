import React, { useState, useEffect, useRef } from "react";
import "../common.css";

const ReminderManager = ({ subscriptions }) => {
  const [reminders, setReminders] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const today = new Date();

    const upcoming = subscriptions.filter((sub) => {
      const renewal = new Date(sub.renewalDate);
      const diffDays = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    });

    const unread = upcoming.filter((sub) => !readIds.includes(sub.id));

    setReminders(unread);
  }, [subscriptions, readIds]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = (id) => {
    setReadIds((prev) => [...prev, id]);
  };

  const markAllAsRead = () => {
    setReadIds((prev) => [...prev, ...reminders.map((r) => r.id)]);
  };

  return (
    <div className="reminder-container" ref={dropdownRef}>
      <div className="icon-wrapper" onClick={() => setOpen(!open)}>
        <span className={`bell-icon ${reminders.length > 0 ? "wiggle" : ""}`}>
          🔔
        </span>

        {reminders.length > 0 && <span className="badge">{reminders.length}</span>}
      </div>

      {open && (
        <div className="reminder-dropdown">
          <div className="dropdown-header">
            <h4>Upcoming Renewals</h4>

            {reminders.length > 0 && (
              <button className="mark-all-btn" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          {reminders.length === 0 ? (
            <p className="empty">No unread reminders.</p>
          ) : (
            reminders.map((sub) => {
              const renewal = new Date(sub.renewalDate);
              const diffDays = Math.ceil(
                (renewal - new Date()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div key={sub.id} className="reminder-item">
                  <div>
                    <strong>{sub.name}</strong>
                    <div className="renew-info">
                      Renews in {diffDays} day(s)
                      <br />
                      <span className="date">{sub.renewalDate}</span>
                    </div>
                  </div>

                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(sub.id)}
                  >
                    ✓
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderManager;
