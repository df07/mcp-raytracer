/* Specs: scene-generator.md */

// Type alias for 3D vectors/points/colors
export type Vec3Array = [number, number, number];

// Scene data structure
export type SceneData = {
  // Camera configuration (positioning and visual settings)
  camera: CameraData;
  
  // Render quality settings
  render?: RenderData;
  
  // Scene objects and materials as arrays
  objects: SceneObject[];
  materials?: MaterialObject[];  // Optional array of named materials
  
  // Optional metadata
  metadata?: {
    name?: string;
    description?: string;
    author?: string;
    version?: string;
  };
}

export type CameraData = {
  vfov?: number;
  from?: Vec3Array;      // lookFrom position
  at?: Vec3Array;        // lookAt target
  up?: Vec3Array;        // vUp direction
  aperture?: number;
  focus?: number;        // focusDistance
  background?: BackgroundData;
}

export type RenderData = {
  width?: number;        // imageWidth
  aspect?: number;       // aspectRatio
  samples?: number;
  depth?: number;        // maxDepth
  adaptTol?: number;     // adaptiveTolerance
  adaptBatch?: number;   // adaptiveBatchSize
  roulette?: boolean;    // russianRouletteEnabled
  rouletteDepth?: number; // russianRouletteDepth
  mode?: string;         // renderMode
}

// Background configuration
export type BackgroundData = GradientBackground;  // More types can be added later

export type GradientBackground = {
  type: 'gradient';
  top: Vec3Array;      // Top color
  bottom: Vec3Array;   // Bottom color
}

// Material with ID
export type MaterialObject = {
  id: string;           // Material identifier for referencing
  material: MaterialData;  // The actual material definition
}

// Plain data representation of scene objects
export type SceneObject = SphereData | PlaneData | QuadData;

export type BaseObjectData = {
  id?: string;           // Optional unique identifier
  type: string;
  material: string | MaterialData;  // Material ID reference or inline definition
  light?: boolean;       // Mark this object as a light source
}

export type SphereData = BaseObjectData & {
  type: 'sphere';
  pos: Vec3Array;        // center position
  r: number;             // radius
}

export type PlaneData = BaseObjectData & {
  type: 'plane';
  pos: Vec3Array;         // point on plane
  u: Vec3Array;          // U direction vector
  v: Vec3Array;          // V direction vector
}

export type QuadData = BaseObjectData & {
  type: 'quad';
  pos: Vec3Array;          // corner point
  u: Vec3Array;          // U edge vector
  v: Vec3Array;          // V edge vector
}

// Plain data representation of materials
export type MaterialData = LambertianData | MetalData | DielectricData | LightData | MixedData | LayeredData;

export type LambertianData = {
  type: 'lambert';
  color: Vec3Array;      // albedo color
}

export type MetalData = {
  type: 'metal';
  color: Vec3Array;      // albedo color
  fuzz: number;
}

export type DielectricData = {
  type: 'glass';
  ior: number;           // refractionIndex
}

export type LightData = {
  type: 'light';
  emit: Vec3Array;       // emission color
}

export type MixedData = {
  type: 'mixed';
  diff: string | MaterialData;  // diffuse material
  spec: string | MaterialData;  // specular material
  weight: number;               // diffuseWeight
}

export type LayeredData = {
  type: 'layered';
  inner: string | MaterialData;     // base material
  outer: string | DielectricData;   // coating material
}
