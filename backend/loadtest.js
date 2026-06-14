import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50, 
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:5000/api/profile/u/v_123');
  check(res, { 'is status 200': (r) => r.status === 200 });
  sleep(0.1); 
}