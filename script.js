let projectCount = 0;

// Function to add a new project
function addProject() {
    projectCount++;
    const template = document.getElementById('project-template').content.cloneNode(true);
    const project = template.querySelector('.project');
    
    // Set project-specific IDs and labels
    project.querySelector('.project-number').textContent = projectCount;
    project.querySelector('#initial_investment1').id = `initial_investment${projectCount}`;
    project.querySelector('#cashflows1-container').id = `cashflows${projectCount}-container`;
    project.querySelector('#discount_rate1').id = `discount_rate${projectCount}`;
    project.querySelector('#results1').id = `results${projectCount}`;

    // Initialize period count for this project
    const tbody = project.querySelector('.cashflow-table tbody');
    tbody.setAttribute('data-period-count', 1);
    updatePeriodOptions(tbody); // Ensure options are correct for the initial state

    // Attach remove project functionality
    const removeButton = project.querySelector('.remove-project-btn');
    removeButton.onclick = function() {
        removeProject(removeButton);
    };

    // Append new project to the container
    document.getElementById('projects-container').appendChild(project);
}

// Function to remove a project
function removeProject(button) {
    const project = button.closest('.project');
    project.remove();
    projectCount--; // Update project count
    // Optionally, recalculate results for remaining projects
    calculate();
}

// Function to add a cashflow input
function addCashflowInput(button) {
    const tbody = button.previousElementSibling.querySelector('tbody');
    const periodCount = parseInt(tbody.getAttribute('data-period-count'), 10);

    // Create a new row with incremented period number
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <select class="cashflow-period">
                ${generatePeriodOptions(periodCount + 1)}
            </select>
        </td>
        <td>
            <input type="number" class="cashflow-input" step="0.01" placeholder="Enter cashflow">
        </td>
        <td>
            <button class="btn btn-danger remove-cashflow-btn" onclick="removeCashflow(this)">Remove</button>
        </td>
    `;
    
    // Append the new row to the table
    tbody.appendChild(row);

    // Update period count
    tbody.setAttribute('data-period-count', periodCount + 1);

    // Recalculate after adding a cashflow
    calculate();
}

// Function to generate options for period dropdown
function generatePeriodOptions(currentPeriod) {
    let options = '';
    for (let i = 1; i <= currentPeriod; i++) {
        options += `<option value="${i}">Period ${i}</option>`;
    }
    return options;
}

// Function to update period options in existing rows
function updatePeriodOptions(container) {
    const periodSelects = container.querySelectorAll('.cashflow-period');
    const periods = Array.from({ length: container.getAttribute('data-period-count') }, (_, i) => i + 1);
    
    periodSelects.forEach(select => {
        select.innerHTML = periods.map(period => 
            `<option value="${period}">Period ${period}</option>`
        ).join('');
    });
}

// Function to remove a cashflow input
function removeCashflow(button) {
    const row = button.closest('tr');
    const tbody = row.closest('tbody');
    row.remove();

    // Update period count
    const periodCount = parseInt(tbody.getAttribute('data-period-count'), 10) - 1;
    tbody.setAttribute('data-period-count', periodCount);

    // Update remaining period options
    updatePeriodOptions(tbody);

    // Recalculate after removal
    calculate();
}

// Function to calculate financial metrics
function calculate() {
    const projects = document.querySelectorAll('.project');
    
    projects.forEach(project => {
        const projectNumber = project.querySelector('.project-number').textContent;
        const results = getProjectData(projectNumber);
        displayResults(results, projectNumber);
    });
}

// Function to gather data for a project
function getProjectData(projectNumber) {
    const discountRate = parseFloat(document.getElementById(`discount_rate${projectNumber}`).value) / 100 || 0.10;
    const initialInvestmentInput = parseFloat(document.getElementById(`initial_investment${projectNumber}`).value);

    const cashflows = Array.from(document.querySelectorAll(`#cashflows${projectNumber}-container .cashflow-input`))
                            .map(input => parseFloat(input.value) || 0);
    
    const expenses = cashflows.filter(cf => cf < 0).reduce((acc, curr) => acc + curr, 0);
    const totalCashflow = cashflows.reduce((acc, curr) => acc + curr, 0);
    
    // Use expenses as initial investment if not provided
    const initialInvestment = !isNaN(initialInvestmentInput) && initialInvestmentInput > 0
        ? initialInvestmentInput
        : -expenses || 0;

    const profit = totalCashflow - Math.abs(expenses);
    const roi = initialInvestment ? (profit / initialInvestment) * 100 : 'N/A';
    const npv = calculateNPV(cashflows, initialInvestment, discountRate);
    const irr = calculateIRR(cashflows, initialInvestment);
    const paybackPeriod = calculatePaybackPeriod(cashflows, initialInvestment);

    return {
        initialInvestment,
        totalCashflow,
        expenses: Math.abs(expenses),
        profit,
        roi,
        npv,
        irr,
        paybackPeriod,
        discountRate
    };
}

// Function to calculate NPV
function calculateNPV(cashflows, initialInvestment, rate) {
    return cashflows.reduce((npv, cashflow, period) => {
        return npv + cashflow / Math.pow(1 + rate, period + 1);
    }, -initialInvestment);
}

// Function to calculate IRR
function calculateIRR(cashflows, initialInvestment) {
    let irr = 0.1;
    let npv = calculateNPV(cashflows, initialInvestment, irr);
    const tolerance = 0.01;
    const maxIterations = 1000;
    let iteration = 0;

    while (Math.abs(npv) > tolerance && iteration < maxIterations) {
        irr += 0.0001;
        npv = calculateNPV(cashflows, initialInvestment, irr);
        iteration++;
    }

    return npv < tolerance ? irr : 'N/A';
}

// Function to calculate Payback Period
function calculatePaybackPeriod(cashflows, initialInvestment) {
    let cumulativeCashflow = 0;
    for (let i = 0; i < cashflows.length; i++) {
        cumulativeCashflow += cashflows[i];
        if (cumulativeCashflow >= initialInvestment) {
            return i + 1; // Periods are 1-based
        }
    }
    return 'N/A'; // If the initial investment is not recovered
}
   // Example JavaScript code for user support and calculation pages

// Function for performing a calculation (used in calculation.html)
function performCalculation() {
    var num1 = parseFloat(document.getElementById('num1').value);
    var num2 = parseFloat(document.getElementById('num2').value);
    var result = num1 + num2; // Example calculation: addition
    document.getElementById('result').innerText = 'Result: ' + result;
}

// You can add more functions as needed for different pages
// Function to display results
function displayResults(results, projectNumber) {
    const resultsDiv = document.getElementById(`results${projectNumber}`);
    resultsDiv.innerHTML = `
        <p>Total Cashflow: ${results.totalCashflow.toFixed(2)}</p>
        <p>Total Expenses: ${results.expenses.toFixed(2)}</p>
        <p>Profit: ${results.profit.toFixed(2)}</p>
        <p>ROI: ${results.roi === 'N/A' ? 'N/A' : results.roi.toFixed(2) + '%'}</p>
        <p>NPV: ${results.npv.toFixed(2)}</p>
        <p>IRR: ${results.irr === 'N/A' ? 'N/A' : (results.irr * 100).toFixed(2) + '%'}</p>
        <p>Payback Period: ${results.paybackPeriod === 'N/A' ? 'N/A' : results.paybackPeriod + ' periods'}</p>
    `;
    resultsDiv.classList.add('fade-in');
}

