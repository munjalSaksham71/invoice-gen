// app/(app)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { DashboardMetrics } from '@/types/dashboard';
import { get, isNumber, toString } from 'lodash-es';

// Utility functions for safe data handling
const formatCurrency = (value: number | undefined): string => {
  if (!isNumber(value)) return '₹ 0';
  return `₹ ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const safeNumber = (value: any): number => {
  return isNumber(value) ? value : 0;
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Safe data getters for charts
  const getChartData = (path: string) => get(metrics, path, []);
  const getSingleValue = (path: string) => get(metrics, path, 0);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Card */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(getSingleValue('overallRevenue'))}
            </p>
          </CardContent>
        </Card>

        {/* New Customers Card */}
        <Card>
          <CardHeader>
            <CardTitle>New Customers This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {toString(getSingleValue('newCustomersThisMonth'))}
            </p>
          </CardContent>
        </Card>

        {/* Monthly Sales Card */}
        <Card>
          <CardHeader>
            <CardTitle>Last 3 Months Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('lastThreeMonthsSales')} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={toString}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(safeNumber(value))}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(safeNumber(value))}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#8884d8"
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData('revenueByMonth')} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={toString}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(safeNumber(value))}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(safeNumber(value))}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData('topProducts')} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tickFormatter={toString}
                />
                <YAxis 
                  yAxisId="revenue"
                  orientation="left"
                  tickFormatter={(value) => formatCurrency(safeNumber(value))}
                />
                <YAxis 
                  yAxisId="quantity"
                  orientation="right"
                  tickFormatter={toString}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'revenue') return formatCurrency(safeNumber(value));
                    return toString(value);
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="revenue"
                  dataKey="revenue" 
                  fill="#8884d8" 
                  name="Revenue"
                />
                <Bar 
                  yAxisId="quantity"
                  dataKey="quantity" 
                  fill="#82ca9d" 
                  name="Quantity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}