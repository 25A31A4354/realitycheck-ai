// Node 22 has built-in fetch

async function testAnalysis() {
    try {
        const response = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: "This is a test contract. Client pays $5/hr."
            })
        });

        const data = await response.json();
        console.log('Status Code:', response.status);
        console.log('Response Keys:', Object.keys(data));

        if (data.content && data.content.confidenceScore !== undefined) {
            console.log('SUCCESS: confidenceScore found:', data.content.confidenceScore);
        } else {
            console.log('FAILURE: confidenceScore MISSING. Content:', JSON.stringify(data.content, null, 2));
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testAnalysis();
