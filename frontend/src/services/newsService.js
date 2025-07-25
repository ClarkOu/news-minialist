// src/services/newsService.js
const API_URL = '/api';

export const fetchLatestNews = async (category = 'all') => {
  try {
    const url = category === 'all' 
      ? `${API_URL}/news` 
      : `${API_URL}/news?category=${category}`;
      
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
};