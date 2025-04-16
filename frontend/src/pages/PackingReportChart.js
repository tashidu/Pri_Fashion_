import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from 'recharts';

const PackingReportChart = () => {
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({
    totalSewn: 0,
    totalPacked: 0,
    availableLeft: 0,
  });

  useEffect(() => {
    axios.get('http://localhost:8000/api/reports/product-packing-report/')
      .then(res => {
        setData(res.data);
        
        // Calculate totals for analytics
        const sewn = res.data.reduce((acc, item) => acc + item.total_sewn, 0);
        const packed = res.data.reduce((acc, item) => acc + item.total_packed, 0);
        const available = res.data.reduce((acc, item) => acc + item.available_quantity, 0);

        setTotals({
          totalSewn: sewn,
          totalPacked: packed,
          availableLeft: available,
        });
      })
      .catch(err => console.error("Report load error", err));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Packing Overview</h2>

      {/* Displaying Quick Analytics */}
      <div className="analytics-summary flex justify-between mb-4">
        <div className="stat">
          <h4 className="text-lg font-semibold">Total Sewn</h4>
          <p className="text-md">{totals.totalSewn} units</p>
        </div>
        <div className="stat">
          <h4 className="text-lg font-semibold">Total Packed</h4>
          <p className="text-md">{totals.totalPacked} units</p>
        </div>
        <div className="stat">
          <h4 className="text-lg font-semibold">Available Left</h4>
          <p className="text-md">{totals.availableLeft} units</p>
        </div>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <XAxis dataKey="product_name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="total_sewn" fill="#8884d8" name="Total Sewn" />
          <Bar dataKey="total_packed" fill="#82ca9d" name="Total Packed" />
          <Bar dataKey="available_quantity" fill="#ffc658" name="Available Left" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PackingReportChart;
