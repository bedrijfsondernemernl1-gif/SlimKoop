fetch('http://localhost:3000/api/analyze', {
    method: 'POST', 
    headers:{'Content-Type': 'application/json'}, 
    body: JSON.stringify({url:'https://test.nl'})
}).then(r=>r.text()).then(t=>console.log(t)).catch(console.error);
