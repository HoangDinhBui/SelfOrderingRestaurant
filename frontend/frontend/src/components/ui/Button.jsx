const Button = ({ children, onClick, variant = "primary" }) => {
    const baseStyles = "px-4 py-2 rounded-lg font-medium transition";
    const variants = {
      primary: "bg-red-500 text-white hover:bg-red-600",
      secondary: "bg-gray-200 text-black hover:bg-gray-300"
    };
  
    return (
      <button className={`${baseStyles} ${variants[variant]}`} onClick={onClick}>
        {children}
      </button>
    );
  };
  
  export default Button;
  