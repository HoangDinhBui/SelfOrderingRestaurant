import { useEffect, useState } from "react";
import { getCustomers } from "../services/api";

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCustomers()
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Danh sách Khách Hàng</h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <li key={customer.id} className="p-4 border rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold">{customer.name}</h3>
            <p className="text-gray-600">{customer.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CustomerList;
