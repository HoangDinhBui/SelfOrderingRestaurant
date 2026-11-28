const Header = () => {
  return (
    <div className="flex justify-center">
      <header className="text-center pt-3 pb-2 w-full max-w-md">
        {/* width/height reserve the logo's space before it loads (no layout shift) */}
        <img
          src="/img/logohome.png"
          alt="Bon Appétit"
          width="720"
          height="163"
          fetchPriority="high"
          className="w-1/2 h-auto mx-auto mb-3"
        />
        <p className="text-sm text-ink-muted">
          450 Lê Văn Việt, Phường Tăng Nhơn Phú A, TP. Thủ Đức
        </p>
      </header>
    </div>
  );
};

export default Header;
