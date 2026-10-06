import React, { useEffect } from "react";
import { FaInstagram, FaGlobe, FaChevronRight } from "react-icons/fa";
import "./connect.css";

/* Standalone "link-in-bio" page (saralowe.ma/connect) — used on business
   cards / Instagram bio. Not linked from the site menu. All styles are
   scoped under .sl-connect so they don't leak into the rest of the app. */

const LOGO = "/assets/img/connect/sara-lowe-logo.png";
const PATTERN = "/assets/img/connect/pattern-illustrations.png";

const SOCIALS = [
  {
    href: "https://www.instagram.com/chefsaraalaoui?stkn=OThqcHZzYjMyNmoy",
    label: "CHEF",
    username: "@chefsaraalaoui",
  },
  {
    href: "https://www.instagram.com/maisonsaralowe?stkn=MWd1MGV0cjBkaWx4MQ==",
    label: "BOUTIQUE",
    username: "@maisonsaralowe",
  },
];

const CONTACTS = [
  { number: "06 03 39 42 33", whatsappNumber: "212603394233" },
  { number: "06 64 57 64 77", whatsappNumber: "212664576477" },
];

const Connect: React.FC = () => {
  useEffect(() => {
    const prevTitle = document.title;
    const prevBg = document.body.style.background;
    document.title = "SARALÖWE · Boutique · Cake Art · Academy";
    document.body.style.background = "#700c2c";
    return () => {
      document.title = prevTitle;
      document.body.style.background = prevBg;
    };
  }, []);

  return (
    <main
      className="sl-connect"
      dir="ltr"
      style={{ "--sl-pattern-image": `url(${PATTERN})` } as React.CSSProperties}
    >
      <div className="sl-connect__content">
        <div className="sl-connect__hero">
          <div className="sl-connect__logo" aria-label="SARA LÖWE logo">
            <img src={LOGO} alt="SARA LÖWE monogram" />
          </div>
          <h1>SARALÖWE</h1>
          <p>BOUTIQUE · CAKE ART · ACADEMY</p>
          <div className="sl-connect__ornament" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
        </div>

        <section className="sl-connect__socials" aria-label="Social media links">
          {SOCIALS.map((s) => (
            <a key={s.username} className="sl-connect__link" href={s.href} target="_blank" rel="noreferrer">
              <span className="sl-connect__icon"><FaInstagram aria-hidden="true" /></span>
              <span className="sl-connect__copy">
                <span className="sl-connect__label">INSTAGRAM · {s.label}</span>
                <span className="sl-connect__value">{s.username}</span>
              </span>
              <FaChevronRight className="sl-connect__chevron" aria-hidden="true" />
            </a>
          ))}
        </section>

        <section className="sl-connect__contact" aria-labelledby="sl-contact-title">
          <h2 id="sl-contact-title">CONTACT US</h2>
          <div className="sl-connect__contact-list">
            {CONTACTS.map((c) => (
              <article key={c.number} className="sl-connect__card">
                <p className="sl-connect__phone">{c.number}</p>
                <div className="sl-connect__actions">
                  <a className="sl-connect__btn sl-connect__btn--outline" href={`tel:${c.number.replace(/ /g, "")}`}>
                    CALL
                  </a>
                  <a
                    className="sl-connect__btn sl-connect__btn--filled"
                    href={`https://api.whatsapp.com/send?phone=${c.whatsappNumber}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WHATSAPP
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sl-connect__website" aria-label="Official website">
          <a className="sl-connect__link" href="https://www.saralowe.ma/" target="_blank" rel="noreferrer">
            <span className="sl-connect__icon"><FaGlobe aria-hidden="true" /></span>
            <span className="sl-connect__copy">
              <span className="sl-connect__label">OFFICIAL WEBSITE</span>
              <span className="sl-connect__value">www.saralowe.ma</span>
            </span>
            <FaChevronRight className="sl-connect__chevron" aria-hidden="true" />
          </a>
        </section>

        <div className="sl-connect__footer">
          <p>Thank you for choosing <strong>SARALÖWE.</strong></p>
        </div>
      </div>
    </main>
  );
};

export default Connect;
