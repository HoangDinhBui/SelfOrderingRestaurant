const SpecialDishCard = ({ name, price, image }) => {
    return (
      <div className="bg-white shadow-md rounded-lg p-3">
        <img src={image} alt={name} className="w-full h-32 object-cover rounded-md" />
        <h3 className="mt-2 font-semibold">{name}</h3>
        <p className="text-red-500 font-bold">${price}</p>
      </div>
    );
  };
  
  export default SpecialDishCard;
  