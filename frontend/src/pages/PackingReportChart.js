// src/pages/PackingReportChart.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from 'recharts';

const PackingReportChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/reports/product-packing-report/')
      .then(res => setData(res.data))
      .catch(err => console.error("Report load error", err));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Packing Overview</h2>
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
