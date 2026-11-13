import { useEffect, useMemo } from 'react';
import { BufferAttribute, Color, PlaneGeometry } from 'three';
import { MAP_HALF_SIZE, ROCKS } from './sceneConfig';

const TERRAIN_SIZE = 96;
const TERRAIN_SEGMENTS = 64;
/** Ground stays flat inside this square half-size so the playable area is level. */
const FLAT_HALF_SIZE = MAP_HALF_SIZE + 3;

const GROUND_DARK = new Color('#8f4429');
const GROUND_BASE = new Color('#a85237');
const GROUND_LIGHT = new Color('#c4724a');
const ROCK_DARK = new Color('#6e3422');
const ROCK_LIGHT = new Color('#9b5338');

function terrainNoise(x: number, z: number): number {
  return (
    Math.sin(x * 0.35 + 1.3) * Math.cos(z * 0.29 - 0.7) * 0.5
    + Math.sin((x + z) * 0.17) * 0.3
    + Math.sin(x * 0.9 - z * 0.7) * 0.2
  );
}

function buildTerrainGeometry(): PlaneGeometry {
  const geometry = new PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const color = new Color();

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const n = terrainNoise(x, z);
    const edge = Math.max(Math.abs(x), Math.abs(z)) - FLAT_HALF_SIZE;
    const height = edge > 0 ? edge * 0.55 * (0.8 + 0.35 * n) : 0;
    position.setY(i, height);

    const t = Math.min(1, Math.max(0, 0.5 + n * 0.45));
    color.copy(GROUND_DARK).lerp(GROUND_BASE, t);
    if (height > 0) color.lerp(GROUND_LIGHT, Math.min(1, height / 10));
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Low-poly Martian ground with a level playable area ringed by hills, plus rocks. */
export default function MarsTerrain() {
  const geometry = useMemo(() => buildTerrainGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const rockColors = useMemo(
    () => ROCKS.map((rock) => `#${ROCK_DARK.clone().lerp(ROCK_LIGHT, rock.tint).getHexString()}`),
    [],
  );

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors flatShading roughness={1} metalness={0} />
      </mesh>
      {ROCKS.map((rock, index) => (
        <mesh
          key={index}
          position={[rock.x, rock.scale * 0.35, rock.z]}
          rotation={rock.rotation}
          scale={[rock.scale, rock.scale * 0.75, rock.scale]}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={rockColors[index]} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
