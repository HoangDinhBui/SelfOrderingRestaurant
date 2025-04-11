// src/pages/Home/RevenueManagement.jsx
import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import MenuBar from "../../../components/layout/MenuBar";

const RevenueManagement = () => {
  const [viewMode, setViewMode] = useState("Day");
  const [chartData, setChartData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [animationComplete, setAnimationComplete] = useState(false);

  // Sample data for different view modes
  const dailyData = [
    { date: "03/04/2025", revenue: 1000, id: 1 },
    { date: "02/04/2025", revenue: 900, id: 2 },
    { date: "01/04/2025", revenue: 850, id: 3 },
    { date: "31/03/2025", revenue: 1100, id: 4 },
    { date: "30/03/2025", revenue: 1200, id: 5 },
    { date: "29/03/2025", revenue: 1300, id: 6 },
    { date: "28/03/2025", revenue: 1500, id: 7 },
  ];

  const monthlyData = [
    { date: "Apr 2025", revenue: 28000, id: 1 },
    { date: "Mar 2025", revenue: 31500, id: 2 },
    { date: "Feb 2025", revenue: 22400, id: 3 },
    { date: "Jan 2025", revenue: 27800, id: 4 },
    { date: "Dec 2024", revenue: 35000, id: 5 },
    { date: "Nov 2024", revenue: 30800, id: 6 },
    { date: "Oct 2024", revenue: 25600, id: 7 },
  ];

  const yearlyData = [
    { date: "2025", revenue: 87900, id: 1 },
    { date: "2024", revenue: 350800, id: 2 },
    { date: "2023", revenue: 273500, id: 3 },
    { date: "2022", revenue: 195600, id: 4 },
    { date: "2021", revenue: 164200, id: 5 },
  ];

  // Update data when view mode changes
  useEffect(() => {
    let data;
    switch(viewMode) {
      case "Month":
        data = monthlyData;
        break;
      case "Year":
        data = yearlyData;
        break;
      default:
        data = dailyData;
    }
    
    // Reset animation state
    setAnimationComplete(false);
    setChartData(data);
    
    // Set animation complete after delay to allow animation to run
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [viewMode]);

  // Filter data based on search query
  const filteredData = chartData.filter(item => 
    item.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.revenue.toString().includes(searchQuery)
  );

  // Function to handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  return (
    <div className="h-screen w-screen flex flex-col h-screen bg-gray-100">
      <MenuBar 
        title="Revenue Management" 
        
      />
      
      <div className="flex-1 p-5 overflow-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h1 className="text-xl font-medium text-gray-800 text-center">Revenue</h1>
            <div className="flex items-center mt-3 pb-3 border-b border-gray-100 justify-end">
              <div className="w-32 mr-2">
                <select 
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={viewMode} 
                  onChange={(e) => handleViewModeChange(e.target.value)}
                >
                  <option value="Day">Day</option>
                  <option value="Month">Month</option>
                  <option value="Year">Year</option>
                </select>
              </div>
              <div className="w-40">
                <input 
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  type="text" 
                  placeholder="Find" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row p-3">
            <div className="w-full md:w-2/5 overflow-y-auto">
                <table className="w-full border-collapse">
                    <thead>
                    <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 text-left font-medium text-gray-600 bg-gray-50">Date</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 bg-gray-50">Revenue</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredData.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          index % 2 === 0 ? 'bg-blue-200' : 'bg-gray-200'
                        }`}
                      >
                        <td className="py-3 px-4 text-gray-700">{item.date}</td>
                        <td className="py-3 px-4 text-gray-800 font-medium">
                          ${item.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}

                    </tbody>
                </table>
            </div>
            
            <div className="w-full md:w-3/5 h-96 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      if (viewMode === "Day") {
                        return value.split('/')[0]; // Just day part
                      } else if (viewMode === "Month") {
                        return value.split(' ')[0]; // Just month part
                      }
                      return value; // Year shows as is
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, 'Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#4adede" 
                    animationDuration={1000}
                    animationBegin={0}
                    animationEasing="ease-out"
                    isAnimationActive={!animationComplete}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueManagement;