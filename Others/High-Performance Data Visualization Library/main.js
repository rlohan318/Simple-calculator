// Advanced High-Performance Data Visualization Library

// WebGL Shader Programs
const VERTEX_SHADER = `
    attribute vec2 a_position;
    attribute vec4 a_color;
    uniform vec2 u_resolution;
    varying vec4 v_color;
    void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        v_color = a_color;
    }
`;

const FRAGMENT_SHADER = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
        gl_FragColor = v_color;
    }
`;

// Main Visualization Class
class AdvancedDataVisualizer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.initializeRenderers();
        this.datasets = new Map();
        this.animations = new Map();
        this.workers = new Map();
        
        this.options = {
            width: options.width || window.innerWidth,
            height: options.height || window.innerHeight,
            padding: options.padding || 40,
            theme: options.theme || 'light',
            renderMode: options.renderMode || 'auto', // 'canvas', 'webgl', 'svg', 'auto'
            animationDuration: options.animationDuration || 500,
            colorSchemes: {
                light: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#1B73E8', '#188038', '#E37400', '#D93025'],
                dark: ['#81B4F9', '#81C995', '#FDE293', '#F28B82', '#669DF6', '#46A35E', '#FBB01B', '#EE675C']
            },
            performance: {
                useWebWorkers: true,
                batchSize: 1000,
                throttleInterval: 16,
                maxPointsBeforeDownsampling: 10000
            }
        };

        this.state = {
            isAnimating: false,
            currentScale: 1,
            offset: { x: 0, y: 0 },
            selectedPoints: new Set()
        };

        this.initializeWebGL();
        this.setupEventHandlers();
        this.initializeWebWorkers();
    }

    initializeRenderers() {
        // Canvas Renderer
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // SVG Renderer
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        
        // WebGL Canvas
        this.glCanvas = document.createElement('canvas');
        
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.svg);
        this.container.appendChild(this.glCanvas);
        
        this.resizeRenderers();
    }

    initializeWebGL() {
        const gl = this.glCanvas.getContext('webgl') || this.glCanvas.getContext('experimental-webgl');
        if (!gl) {
            console.warn('WebGL not supported, falling back to Canvas rendering');
            return;
        }
        
        this.gl = gl;
        this.glProgram = this.createWebGLProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
        this.initializeWebGLBuffers();
    }

    createWebGLProgram(gl, vertexShaderSource, fragmentShaderSource) {
        const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        return program;
    }

    initializeWebGLBuffers() {
        const gl = this.gl;
        this.buffers = {
            position: gl.createBuffer(),
            color: gl.createBuffer(),
            index: gl.createBuffer()
        };
    }

    initializeWebWorkers() {
        if (!this.options.performance.useWebWorkers) return;
        
        const workerTasks = ['dataProcessing', 'calculations', 'animations'];
        workerTasks.forEach(task => {
            const worker = new Worker(`workers/${task}Worker.js`);
            this.workers.set(task, worker);
            
            worker.onmessage = (e) => this.handleWorkerMessage(task, e.data);
        });
    }

    // Advanced Data Management
    addDataset(id, data, options = {}) {
        const processedData = this.preprocessData(data);
        const datasetConfig = {
            data: processedData,
            type: options.type || 'line',
            visible: options.visible !== false,
            style: {
                color: options.color || this.getNextColor(),
                opacity: options.opacity || 1,
                lineWidth: options.lineWidth || 2
            },
            transforms: [],
            metadata: new Map()
        };
        
        this.datasets.set(id, datasetConfig);
        this.updateScalesAndAxes();
    }

    preprocessData(data) {
        if (data.length > this.options.performance.maxPointsBeforeDownsampling) {
            return this.downsampleData(data);
        }
        return this.normalizeData(data);
    }

    // Advanced Rendering Pipeline
    render() {
        if (this.state.isAnimating) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.animationFrame = requestAnimationFrame(() => {
            this.clearAllRenderers();
            
            switch (this.options.renderMode) {
                case 'webgl':
                    this.renderWebGL();
                    break;
                case 'svg':
                    this.renderSVG();
                    break;
                case 'canvas':
                    this.renderCanvas();
                    break;
                case 'auto':
                    this.autoSelectRenderer();
                    break;
            }
            
            this.renderAxes();
            this.renderLegend();
            this.renderOverlays();
        });
    }

    renderWebGL() {
        const gl = this.gl;
        gl.useProgram(this.glProgram);
        
        this.datasets.forEach(dataset => {
            if (!dataset.visible) return;
            this.updateWebGLBuffers(dataset);
            this.drawWebGLDataset(dataset);
        });
    }

    // Advanced Interaction Handlers
    setupEventHandlers() {
        const handlers = {
            wheel: this.handleZoom.bind(this),
            mousedown: this.handlePanStart.bind(this),
            mousemove: this.handlePanMove.bind(this),
            mouseup: this.handlePanEnd.bind(this),
            dblclick: this.handleDoubleClick.bind(this)
        };

        Object.entries(handlers).forEach(([event, handler]) => {
            this.container.addEventListener(event, handler, { passive: true });
        });

        // Touch events for mobile support
        this.setupTouchHandlers();
        
        // Handle window resize with debouncing
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
    }

    // Advanced Animation System
    animate(config) {
        const animation = new Animation(config);
        this.animations.set(config.id, animation);
        
        if (this.options.performance.useWebWorkers) {
            this.workers.get('animations').postMessage({
                type: 'startAnimation',
                config: animation.serialize()
            });
        } else {
            animation.start(this.render.bind(this));
        }
    }

    // Data Export and Import
    exportConfiguration() {
        return {
            datasets: Array.from(this.datasets.entries()),
            options: this.options,
            state: this.state,
            animations: Array.from(this.animations.entries())
        };
    }

    importConfiguration(config) {
        this.datasets = new Map(config.datasets);
        this.options = { ...this.options, ...config.options };
        this.state = { ...this.state, ...config.state };
        this.animations = new Map(config.animations);
        this.render();
    }

    // Utility Methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    destroy() {
        // Cleanup resources
        this.workers.forEach(worker => worker.terminate());
        this.animations.forEach(animation => animation.stop());
        this.container.innerHTML = '';
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
    }
}

// Supporting Classes
class Animation {
    constructor(config) {
        this.id = config.id;
        this.duration = config.duration;
        this.easing = config.easing || 'easeInOutCubic';
        this.startValue = config.startValue;
        this.endValue = config.endValue;
        this.onUpdate = config.onUpdate;
        this.onComplete = config.onComplete;
    }

    start(renderCallback) {
        // Animation implementation
    }

    stop() {
        // Stop animation
    }

    serialize() {
        // Serialize animation state for web workers
    }
}

// Export the library
export { AdvancedDataVisualizer };

// Example usage:
/*
const visualizer = new AdvancedDataVisualizer('visualization-container', {
    renderMode: 'webgl',
    performance: {
        useWebWorkers: true,
        batchSize: 2000
    }
});

visualizer.addDataset('main', largeDataset, {
    type: 'scatter',
    color: '#4285F4'
});

visualizer.animate({
    id: 'zoom',
    duration: 1000,
    startValue: 1,
    endValue: 2,
    easing: 'easeInOutCubic'
});
*/

