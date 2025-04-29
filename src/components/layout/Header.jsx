// filepath: c:\MinhTu\selforderingrestaurant\src\components\layout\Header.jsx
const Header = () => {
  return (
    <div className="flex justify-center">
      <header className="text-center py-2 w-90 max-w-md">  {/* Giới hạn chiều rộng */}
        <img src="/src/assets/img/logohome.png" alt="Logo" className="w-1/2 mx-auto mb-4" />
        <p className="text-sm text-gray-600">
          450 Le Van Viet Street, Tang Nhon Phu A Ward, District 9
        </p>
      </header>
    </div>
  );
};

export default Header;