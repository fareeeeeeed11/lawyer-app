import fetch from 'node-fetch';

async function testApi() {
    try {
        const res = await fetch('http://localhost:3000/api/sessions/upcoming/1');
        const text = await res.text();
        console.log('Response Status:', res.status);
        console.log('Response Headers:', res.headers.get('content-type'));
        console.log('Response Body:', text.substring(0, 500));
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testApi();
