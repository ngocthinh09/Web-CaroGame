document.addEventListener('DOMContentLoaded', () => {
    const gameRecordsBody = document.getElementById('gameRecordsBody');
    const loadingSpinner = document.getElementById('loadingSpinner');


    async function fetchGameRecords() {
        try {
            const response = await fetch('http://0.0.0.0:8000/record/game-records');
            
            if (!response.ok) {
                throw new Error('Failed to fetch game records');
            }
            
            const records = await response.json();
            return records;
        } catch (error) {
            console.error('Error fetching game records:', error);
            return [];
        }
    }
    
    function renderGameRecords(records) {
        gameRecordsBody.innerHTML = '';
        
        if (records.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="3" style="text-align: center">No game records found</td>`;
            gameRecordsBody.appendChild(row);
            return;
        }
        
        records.forEach((record, index) => {
            const row = document.createElement('tr');
            
            console.log(record)    // debug

            const date = new Date(record.timeSaved);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${record.nameMatch}</td>
                <td>${formattedDate}</td>
            `;
            
            row.addEventListener('click', () => {
                sessionStorage.setItem('replayGame', JSON.stringify(record));
                window.location.href = 'replay.html';
            });
            
            gameRecordsBody.appendChild(row);
        });
    }
    

    async function loadGameRecords() {
        loadingSpinner.style.display = 'flex';
        
        const records = await fetchGameRecords();
        
        loadingSpinner.style.display = 'none';
        renderGameRecords(records);
    }
    
    loadGameRecords();
});