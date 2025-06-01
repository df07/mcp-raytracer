/* Specs: mcp-server.md */

import { generateImageBuffer, RaytracerOptions } from './raytracer.js';
import { RenderMode, RenderOptions } from './camera.js';
import { SpheresSceneOptions, SceneConfig, RainSceneOptions, CornellSceneOptions } from './scenes/scenes.js';
import fs from 'fs/promises';

// New function to run performance testing from command line
export async function runRaytracerBenchmark() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const renderOptions: RenderOptions = {};
  const spheresSceneOptions: SpheresSceneOptions = {};
  const rainSceneOptions: RainSceneOptions = {};
  const cornellSceneOptions: CornellSceneOptions = {};
  const generationOptions = {
    verbose: true,
    output: null as string | null,
    iterations: 1,
    parallel: false,
    threads: undefined as number | undefined,
    sceneType: 'default' as 'default' | 'spheres' | 'rain' | 'cornell'
  };
  // Process args
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--width' || arg === '-w') {
      renderOptions.imageWidth = parseInt(args[++i], 10);
    } else if (arg === '--samples' || arg === '-s') {
      renderOptions.samples = parseInt(args[++i], 10);
    } else if (arg === '--output' || arg === '-o') {
      generationOptions.output = args[++i];
    } else if (arg === '--iterations' || arg === '-i') {
      generationOptions.iterations = parseInt(args[++i], 10);
    } else if (arg === '--spheres') {
      spheresSceneOptions.count = parseInt(args[++i], 10);
      generationOptions.sceneType = 'spheres';
    } else if (arg === '--seed') {
      const seedValue = parseInt(args[++i], 10);
      spheresSceneOptions.seed = seedValue;
      rainSceneOptions.seed = seedValue;
    } else if (arg === '--adaptive-tolerance' || arg === '--at') {
      renderOptions.adaptiveTolerance = parseFloat(args[++i]);
    } else if (arg === '--adaptive-batch' || arg === '--ab') {
      renderOptions.adaptiveBatchSize = parseInt(args[++i], 10);
    } else if (arg === '--parallel' || arg === '-p') {
      generationOptions.parallel = true;
    } else if (arg === '--threads' || arg === '-t') {
      generationOptions.threads = parseInt(args[++i], 10);
    } else if (arg === '--mode' || arg === '-m') {
      const mode = args[++i] as RenderMode;
      if (!Object.values(RenderMode).includes(mode)) {
        console.error(`Invalid render mode: ${mode}`);
        process.exit(1);
      }
      renderOptions.renderMode = mode;
    } 
    // Rain scene - just the number of spheres
    else if (arg === '--rain') {
      rainSceneOptions.count = parseInt(args[++i], 10);
      generationOptions.sceneType = 'rain';
    }
    // Cornell scene - with variant option
    else if (arg === '--cornell') {
      const variant = args[++i] as 'spheres' | 'empty';
      if (variant !== 'spheres' && variant !== 'empty') {
        console.error(`Invalid Cornell variant: ${variant}. Use 'spheres' or 'empty'.`);
        process.exit(1);
      }
      cornellSceneOptions.variant = variant;
      generationOptions.sceneType = 'cornell';
    } 
    else if (arg === '--help' || arg === '-h') {
      console.log(`
Raytracer Performance Benchmark

Usage: node dist/src/index.js [options]

Options:
  --width, -w <number>     Image width (default: 400)  
  --samples, -s <number>   Samples per pixel (default: 100)
  --output, -o <file>      Output PNG file  
  --iterations, -i <num>   Number of iterations to run (default: 1)
  --spheres <number>       Number of random spheres to generate (spheres scene)
  --rain <number>          Number of metallic raindrops to generate (rain scene)
  --cornell <variant>      Cornell box scene ('spheres' or 'empty')
  --seed <number>          Random seed for deterministic scene generation
  --adaptive-tolerance <n> Convergence tolerance for adaptive sampling (default: 0.05)
  --adaptive-batch <n>     Number of samples to process in one batch (default: 32)
  --parallel, -p           Use parallel rendering with worker threads
  --threads, -t <number>   Number of worker threads to use
  --help, -h               Show this help
      `);
      process.exit(0);
    }
  }
  console.error(`Running raytracer with options:`);
  console.error(`  Dimensions: ${renderOptions.imageWidth}`);
  console.error(`  Samples: ${renderOptions.samples}`);
  console.error(`  Scene type: ${generationOptions.sceneType}`);
  if (generationOptions.sceneType === 'cornell') {
    console.error(`  Cornell variant: ${cornellSceneOptions.variant}`);
  }
  if (spheresSceneOptions.seed !== undefined || rainSceneOptions.seed !== undefined) {
    console.error(`  Seed: ${spheresSceneOptions.seed || rainSceneOptions.seed}`);
  }
  console.error(`  Output: ${generationOptions.output || 'none (image discarded)'}`);
  if (generationOptions.iterations > 1) {
    console.error(`  Iterations: ${generationOptions.iterations}`);
  }
  if (generationOptions.parallel) {
    console.error(`  Parallel: true ${generationOptions.threads ? `(${generationOptions.threads} threads)` : ''}`);
  }

  const totalStartTime = Date.now();
  let totalRenderTime = 0;

  // Run multiple iterations as specified
  for (let iter = 1; iter <= generationOptions.iterations; iter++) {
    console.error(`\nIteration ${iter}/${generationOptions.iterations}:`);

    // Measure time
    const iterStartTime = Date.now();
      try {      
        // Configure scene based on command line options
        let sceneConfig: SceneConfig;

        if (generationOptions.sceneType === 'spheres' && Object.keys(spheresSceneOptions).length > 0) {
          sceneConfig = { 
            type: 'spheres',
            render: Object.keys(renderOptions).length > 0 ? renderOptions : undefined,
            options: spheresSceneOptions
          };
        } else if (generationOptions.sceneType === 'rain') {
          sceneConfig = {
            type: 'rain',
            render: Object.keys(renderOptions).length > 0 ? renderOptions : undefined,
            options: rainSceneOptions
          };
        } else if (generationOptions.sceneType === 'cornell') {
          sceneConfig = {
            type: 'cornell',
            render: Object.keys(renderOptions).length > 0 ? renderOptions : undefined,
            options: cornellSceneOptions
          };
        } else {
          sceneConfig = { 
            type: 'default',
            render: Object.keys(renderOptions).length > 0 ? renderOptions : undefined
          };
        }

        // Set up rendering options
        const raytracerOptions: RaytracerOptions = {
          parallel: generationOptions.parallel,
          threads: generationOptions.threads,
          verbose: generationOptions.verbose
        };

        // Generate the image
        const pngBuffer = await generateImageBuffer(sceneConfig, raytracerOptions);

        const iterDuration = Date.now() - iterStartTime;
        totalRenderTime += iterDuration;
        console.error(`  Render time: ${iterDuration}ms`);

        // Save the output file (only for the first iteration if multiple)
        if (generationOptions.output && iter === 1) {
          await fs.writeFile(generationOptions.output, pngBuffer);
          console.error(`  Image saved to ${generationOptions.output}`);
        }
    } catch (error) {
      console.error(`Error in iteration ${iter}:`, error);
      process.exit(1);
    }
  }
  
  // Calculate and display stats
  const totalDuration = Date.now() - totalStartTime;
  const avgRenderTime = totalRenderTime / generationOptions.iterations;
    console.error(`\nPerformance Summary:`);
  console.error(`  Implementation: ${generationOptions.parallel ? 'parallel' : 'single-threaded'}`);
  console.error(`  Total time: ${totalDuration}ms`);
  console.error(`  Average render time: ${avgRenderTime.toFixed(2)}ms`);
  console.error(`  Iterations: ${generationOptions.iterations}`);
} 