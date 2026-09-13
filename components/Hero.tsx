import Image from "next/image";
import { FACEBOOK_PAGE_URL } from "../data/menu";

export function Hero() {
  return (
    <section className="hero-grid">
      <div className="hero-copy">
        <p className="eyebrow">Homemade matcha bar</p>
        <h1>matcha.holic</h1>
        <p>
          Matcha lattes, sữa yến mạch, coconut matcha, bánh ngọt và cà phê
          pha phin theo phong cách thủ công đậm đà. Đặt món và gửi trực tiếp qua Facebook Messenger.
        </p>
        <div className="hero-actions">
          <a className="primary-link" href="#drinks">
            Chọn món từ menu
          </a>
          <a
            className="secondary-link"
            href={FACEBOOK_PAGE_URL}
            rel="noreferrer"
            target="_blank"
          >
            Trang Facebook
          </a>
        </div>
      </div>

      <div className="poster-stack" aria-label="Original menu posters">
        <Image
          src="/menu-drinks.png"
          alt="Matcha.holic drinks menu poster"
          width={749}
          height={932}
          priority
          sizes="(max-width: 768px) 50vw, 380px"
        />
        <Image
          src="/menu-pastries-coffee.png"
          alt="Matcha.holic pastries and coffee menu poster"
          width={746}
          height={931}
          priority
          sizes="(max-width: 768px) 40vw, 300px"
        />
      </div>
    </section>
  );
}
