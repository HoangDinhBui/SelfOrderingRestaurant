// filepath: c:\MinhTu\selforderingrestaurant\src\components\layout\Header.jsx
const Header = () => {
  return (
    <div className="flex justify-center">
      <header className="text-center py-2 w-full max-w-md">  {/* Giới hạn chiều rộng */}
        <h1 className="text-xl font-bold italic" style={{ fontFamily: "'Dancing Script', cursive" }}>
          Bon Appétit
        </h1>
        <p className="text-base text-gray-600">
          450 Le Van Viet Street, Tang Nhon Phu A Ward, District 9
        </p>
      </header>
    </div>
  );
};

export default Header;