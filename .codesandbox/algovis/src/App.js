import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';
// Global delay function for visualization
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function App() {
    const [code, setCode] = useState('');
    const [logs, setLogs] = useState([]);
    const [arrayData, setArrayData] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(null);
    const runCodeRef = useRef();

    // Function to add a log entry
    const addLog = (message) => {
        setLogs((prevLogs) => [...prevLogs, message]);
    };

    // Delay function for visualization
    

    // Initialize the array based on code content dynamically
    const initializeArray = () => {
        setLogs([]);
        setHighlightedIndex(null);

        // Detect array initialization in code
        const arrayMatch = code.match(/const\s+(\w+)\s*=\s*\[(.*?)\]/);
        if (arrayMatch) {
            const arrayValues = JSON.parse(`[${arrayMatch[2]}]`);
            setArrayData(arrayValues);
            addLog(`Initialized array: ${JSON.stringify(arrayValues)}`);
        } else {
            addLog("No array found in the code for visualization.");
        }
    };

    // Highlight a specific element in the array
    const highlightElement = async (index) => {
        setHighlightedIndex(index);
        addLog(`Highlighting element at index ${index}: ${arrayData[index]}`);
        await delay(500); // Pause for visualization
    };

    // Update array in real-time during iteration
    const updateArrayData = async (newArray) => {
        setArrayData([...newArray]);
        await delay(500); // Pause to visualize the updated array state
    };

    // Wrap array access for dynamic visualization of changes
    // Wrap array access for dynamic visualization of changes
const proxyArray = (arr) => {
    return new Proxy(arr, {
        get(target, prop) {
            if (typeof prop === 'string' && !isNaN(prop)) {
                // Wrap in async context to allow delay
                (async () => {
                    await highlightElement(Number(prop));  
                    await delay(500);  // Pause to allow visualization of the highlight
                })();
            }
            return target[prop];
        },
        set(target, prop, value) {
            target[prop] = value;
            // Wrap in async context to allow delay
            (async () => {
                setArrayData([...target]);  // Update array data in real-time
                await delay(500);  // Pause to visualize the updated array state
            })();
            return true;
        }
    });
};


    // Load example Bubble Sort code
    const loadExampleBubbleSort = () => {
        const exampleCode = `// Bubble Sort example
const list = [9, 7, 5, 3, 1, 8, 6, 4, 2, 0]; // Example list

// Bubble Sort with visualization
async function bubbleSort() {
    for (let i = 0; i < list.length - 1; i++) {
        for (let j = 0; j < list.length - i - 1; j++) {
            // Highlight the current elements being compared
            await highlightElement(j);
            await highlightElement(j + 1);

            // Compare and swap if necessary
            if (list[j] > list[j + 1]) {
                const temp = list[j];
                list[j] = list[j + 1];
                list[j + 1] = temp;

                // Update the array data in the visualizer
                await updateArrayData(list);
            }
        }
    }
}

// Run the bubble sort function with visualization
await bubbleSort();
`;
        setCode(exampleCode);
        initializeArray();
    };
    const instrumentCodeForVisualization = (userCode) => {
        // Use a regular expression to detect for-loops iterating over arrays like `list`
        return userCode.replace(
            /for\s*\(\s*let\s+(\w+)\s*=\s*0\s*;\s*\1\s*<\s*(\w+)\.length\s*;\s*\1\+\+\s*\)\s*\{([\s\S]*?)\}/g,
            (match, iterator, array, body) => {
                // Inject `await highlightElement` and `await delay` within the loop body
                const instrumentedBody = `
                    await highlightElement(${iterator});
                    await delay(500); // Pause for visualization
                    ${body}
                    await updateArrayData(${array});
                `;
                // Return the modified loop
                return `for (let ${iterator} = 0; ${iterator} < ${array}.length; ${iterator}++) {${instrumentedBody}}`;
            }
        );
    };
    

    // Execute the code with dynamic line-by-line visualization
    const executeCode = async () => {
        setLogs([]);
        setHighlightedIndex(null);
        initializeArray(); // Initialize array before executing
    
        // Wrap arrayData with proxy for highlighting
        let dynamicArray = proxyArray([...arrayData]);
    
        // Instrument user code for automatic visualization of arrays
        const instrumentedCode = instrumentCodeForVisualization(code);
    
        // Define the execution scope with injected functions
        const wrappedCode = `
            (async function() {
                let arrayData = dynamicArray;
                ${instrumentedCode}
            })();
        `;
    
        try {
            // Execute instrumented code with visualization functions in scope, including delay
            await new Function(
                'dynamicArray', 
                'highlightElement', 
                'updateArrayData', 
                'log', 
                'delay',  // Pass delay as an additional argument
                wrappedCode
            )(dynamicArray, highlightElement, updateArrayData, addLog, delay); // Pass delay here
            addLog("Code executed successfully");
        } catch (error) {
            addLog(`Error: ${error.message}`);
        }
    };
    
    

    // Render the UI
    return (
        <div className="App">
            <div className="editor-section" style={{ width: '60%' }}>
                <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    defaultValue="// Write your algorithm here"
                    value={code}
                    onChange={(newCode) => setCode(newCode)}
                />
                <button onClick={executeCode} ref={runCodeRef}>Run Code</button>
                <button onClick={loadExampleBubbleSort}>Load Bubble Sort</button>
                <button onClick={initializeArray}>Initialize Array</button>
            </div>
            <div className="visualization-section">
                <div className="array-visualization">
                    <h3>Array</h3>
                    <div className="array-elements">
                        {arrayData.map((value, index) => (
                            <div
                                key={index}
                                className={`array-element ${index === highlightedIndex ? 'highlighted' : ''}`}
                            >
                                {value}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="logs">
                    <h3>Logs</h3>
                    <div className="log-entries">
                        {logs.map((log, index) => (
                            <div key={index} className="log-entry">{log}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;


