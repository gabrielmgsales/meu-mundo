import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Cloud, Float, Sky, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { MAP_SIZE, createWorldLayout, isLakeTile } from './world-layout.js';

const buildingCatalog = {
  cabin: { label: 'Cabana', cost: { wood: 12, stone: 8 }, color: '#d6a770' },
  field: { label: 'Plantação', cost: { wood: 8, stone: 3 }, color: '#c5de72' },
  fence: { label: 'Cerca', cost: { wood: 4 }, color: '#9d6b3d' },
  well: { label: 'Poço', cost: { wood: 6, stone: 8 }, color: '#80c8ef' },
  barn: { label: 'Celeiro', cost: { wood: 16, stone: 10 }, color: '#c98f54' },
  deck: { label: 'Deck', cost: { wood: 8, stone: 4 }, color: '#d9b46c' },
  boat: { label: 'Barco', cost: { wood: 10 }, color: '#7ab5d8' },
};

const worldTiles = createWorldLayout(MAP_SIZE);

const initialInventory = {
  wood: 18,
  stone: 12,
  grain: 0,
  food: 12,
  water: 8,
};

function BuildingModel({ type, color, position }) {
  const scale = type === 'barn' ? 1.2 : 1;

  return (
    <group position={position} scale={scale}>
      {type === 'cabin' && (
        <>
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.7, 1.2]} />
            <meshStandardMaterial color={color} roughness={0.95} />
          </mesh>
          <mesh position={[0, 1.0, 0]} castShadow>
            <coneGeometry args={[1.1, 1, 4]} />
            <meshStandardMaterial color="#6d4b34" roughness={0.9} />
          </mesh>
        </>
      )}

      {type === 'field' && (
        <group position={[0, 0.12, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[1.4, 0.18, 1.4]} />
            <meshStandardMaterial color="#8d6d46" roughness={1} />
          </mesh>
          {Array.from({ length: 12 }).map((_, index) => (
            <mesh key={index} position={[(index % 4) * 0.3 - 0.45, 0.2, Math.floor(index / 4) * 0.3 - 0.45]} castShadow>
              <cylinderGeometry args={[0.05, 0.08, 0.5, 8]} />
              <meshStandardMaterial color="#6cc85c" roughness={0.8} />
            </mesh>
          ))}
        </group>
      )}

      {type === 'fence' && (
        <group position={[0, 0.35, 0]}>
          {[-0.55, -0.18, 0.18, 0.55].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]} castShadow>
              <boxGeometry args={[0.09, 0.7, 0.09]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
          ))}
        </group>
      )}

      {type === 'well' && (
        <group position={[0, 0.2, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.75, 0.75, 0.7, 20]} />
            <meshStandardMaterial color="#8aa3ad" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.2, 20]} />
            <meshStandardMaterial color="#60b8df" roughness={0.2} />
          </mesh>
        </group>
      )}

      {type === 'barn' && (
        <>
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.8, 1.2, 1.4]} />
            <meshStandardMaterial color={color} roughness={0.95} />
          </mesh>
          <mesh position={[0, 1.55, 0]} castShadow>
            <coneGeometry args={[1.5, 1.3, 4]} />
            <meshStandardMaterial color="#724931" roughness={0.9} />
          </mesh>
        </>
      )}

      {type === 'deck' && (
        <group position={[0, 0.1, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.25, 0.18, 1.25]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <boxGeometry args={[1.5, 0.08, 1.5]} />
            <meshStandardMaterial color="#4eb5d6" transparent opacity={0.75} roughness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function BoatModel({ boat }) {
  if (!boat) return null;

  return (
    <group position={[boat.x, 0.18, boat.z]} rotation={[0, boat.rotation ?? 0, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.22, 0.7]} />
        <meshStandardMaterial color="#8bc3dc" roughness={0.7} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.75, 0.18, 0.42]} />
        <meshStandardMaterial color="#d4eff8" roughness={0.5} />
      </mesh>
      <mesh position={[-0.32, -0.1, 0.22]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
        <meshStandardMaterial color="#6d4b34" roughness={0.9} />
      </mesh>
      <mesh position={[0.32, -0.1, 0.22]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
        <meshStandardMaterial color="#6d4b34" roughness={0.9} />
      </mesh>
      <mesh position={[-0.32, -0.1, -0.22]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
        <meshStandardMaterial color="#6d4b34" roughness={0.9} />
      </mesh>
      <mesh position={[0.32, -0.1, -0.22]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
        <meshStandardMaterial color="#6d4b34" roughness={0.9} />
      </mesh>
    </group>
  );
}

function TileWorld({
  x,
  z,
  tileType,
  building,
  selected,
  onClick,
  onPointerOver,
}) {
  const colors = {
    meadow: '#5dbd65',
    forest: '#2f7042',
    river: '#3ea5d8',
    rock: '#838b95',
    tree: '#4ea755',
  };

  return (
    <group position={[x, 0, z]}>
      <mesh
        position={[0, -0.1, 0]}
        onClick={onClick}
        onPointerOver={onPointerOver}
        receiveShadow
      >
        <boxGeometry args={[1, 0.2, 1]} />
        <meshStandardMaterial color={colors[tileType] ?? '#56a861'} roughness={1} />
      </mesh>

      {tileType === 'tree' && (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1}>
          <group position={[0, 0.38, 0]}>
            <mesh position={[0, 0.35, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.18, 0.7, 12]} />
              <meshStandardMaterial color="#7b4d2d" roughness={1} />
            </mesh>
            <mesh position={[0, 0.9, 0]} castShadow>
              <sphereGeometry args={[0.42, 18, 18]} />
              <meshStandardMaterial color="#3aa25b" roughness={0.9} />
            </mesh>
          </group>
        </Float>
      )}

      {tileType === 'rock' && (
        <mesh position={[0, 0.25, 0]} castShadow>
          <dodecahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial color="#7a7f88" roughness={1} />
        </mesh>
      )}

      {tileType === 'river' && (
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.9, 0.08, 0.9]} />
          <meshStandardMaterial color="#5ad5ff" transparent opacity={0.8} roughness={0.2} />
        </mesh>
      )}

      {building && (
        <BuildingModel
          type={building.type}
          color={buildingCatalog[building.type].color}
          position={[0, 0.26, 0]}
        />
      )}

      {selected && (
        <mesh position={[0, 0.18, 0]}>
          <ringGeometry args={[0.38, 0.5, 24]} />
          <meshStandardMaterial color="#d8ffe4" emissive="#8df3a7" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

function AnimalModel({ animal }) {
  const position = [animal.x, 0.45, animal.z];

  return (
    <group position={position} rotation={[0, animal.rotation, 0]}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.7, 0.4, 0.5]} />
        <meshStandardMaterial color={animal.color} roughness={0.9} />
      </mesh>
      <mesh position={[0.35, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#f5d9bb" roughness={0.9} />
      </mesh>
      <mesh position={[0.28, 0.15, 0.18]} castShadow>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshStandardMaterial color="#4d2d1a" />
      </mesh>
      <mesh position={[0.28, 0.15, -0.18]} castShadow>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshStandardMaterial color="#4d2d1a" />
      </mesh>
      <mesh position={[-0.28, 0.15, 0.18]} castShadow>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshStandardMaterial color="#4d2d1a" />
      </mesh>
      <mesh position={[-0.28, 0.15, -0.18]} castShadow>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshStandardMaterial color="#4d2d1a" />
      </mesh>
    </group>
  );
}

function WeatherSystem({ mode }) {
  const rainColor = mode === 'rain' ? '#bfe7ff' : '#fff7d2';

  return (
    <>
      <ambientLight intensity={mode === 'rain' ? 0.9 : 1.2} />
      <directionalLight
        position={[7, 12, 8]}
        intensity={mode === 'rain' ? 1.2 : 1.8}
        color={mode === 'rain' ? '#b9d9ff' : '#fff0bf'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {mode === 'rain' && (
        <group>
          {Array.from({ length: 28 }).map((_, index) => (
            <mesh key={index} position={[-6 + (index % 7) * 2, 5.5 + (index % 3), -4 + Math.floor(index / 7) * 2]}>
              <boxGeometry args={[0.04, 0.8, 0.04]} />
              <meshStandardMaterial color={rainColor} transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      )}
    </>
  );
}

function WorldScene({ tiles, buildings, selectedTile, onTileClick, playerPosition, crops, animals, weather, isTileUnlocked, boat }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
        <planeGeometry args={[MAP_SIZE + 8, MAP_SIZE + 8, 1, 1]} />
        <meshStandardMaterial color={weather === 'rain' ? '#4c8155' : '#5ea75d'} roughness={1} />
      </mesh>

      {tiles.map((row) =>
        row.map(({ type, row: r, col: c }) => {
          const building = buildings.find((b) => b.x === r && b.y === c);
          const isSelected = selectedTile.row === r && selectedTile.col === c;
          const unlocked = isTileUnlocked(r, c);

          return (
            <group key={`${r}-${c}`} position={[c - MAP_SIZE / 2 + 0.5, 0, r - MAP_SIZE / 2 + 0.5]}>
              <mesh
                position={[0, -0.12, 0]}
                onClick={(event) => {
                  if (!unlocked) return;
                  event.stopPropagation();
                  onTileClick(r, c, type);
                }}
                receiveShadow
              >
                <boxGeometry args={[1, 0.2, 1]} />
                <meshStandardMaterial
                  color={
                    unlocked
                      ? type === 'meadow'
                        ? '#5dbd65'
                        : type === 'forest'
                          ? '#2f7042'
                          : type === 'river'
                            ? '#3ea5d8'
                            : type === 'rock'
                              ? '#838b95'
                              : type === 'lake'
                                ? '#42a6d8'
                                : type === 'mountain'
                                  ? '#8c9292'
                                  : type === 'waterfall'
                                    ? '#7ec9e8'
                                    : '#4ea755'
                      : '#2d3a34'
                  }
                  roughness={1}
                  transparent
                  opacity={unlocked ? 1 : 0.45}
                />
              </mesh>

              {type === 'tree' && unlocked && (
                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1}>
                  <group position={[0, 0.38, 0]}>
                    <mesh position={[0, 0.35, 0]} castShadow>
                      <cylinderGeometry args={[0.12, 0.18, 0.7, 12]} />
                      <meshStandardMaterial color="#7b4d2d" roughness={1} />
                    </mesh>
                    <mesh position={[0, 0.9, 0]} castShadow>
                      <sphereGeometry args={[0.42, 18, 18]} />
                      <meshStandardMaterial color="#3aa25b" roughness={0.9} />
                    </mesh>
                  </group>
                </Float>
              )}

              {type === 'rock' && unlocked && (
                <mesh position={[0, 0.25, 0]} castShadow>
                  <dodecahedronGeometry args={[0.28, 0]} />
                  <meshStandardMaterial color="#7a7f88" roughness={1} />
                </mesh>
              )}

              {type === 'lake' && unlocked && (
                <mesh position={[0, 0.06, 0]}>
                  <boxGeometry args={[0.92, 0.08, 0.92]} />
                  <meshStandardMaterial color="#5ad5ff" transparent opacity={0.8} roughness={0.2} />
                </mesh>
              )}

              {type === 'waterfall' && unlocked && (
                <group position={[0, 0.46, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.5, 1.2, 0.5]} />
                    <meshStandardMaterial color="#8fe2ff" transparent opacity={0.8} roughness={0.25} />
                  </mesh>
                  <mesh position={[0, -0.72, 0]}>
                    <sphereGeometry args={[0.38, 12, 12]} />
                    <meshStandardMaterial color="#d7f3ff" transparent opacity={0.7} roughness={0.2} />
                  </mesh>
                </group>
              )}

              {type === 'mountain' && unlocked && (
                <group position={[0, 0.4, 0]}>
                  <mesh castShadow>
                    <coneGeometry args={[0.7, 1.3, 6]} />
                    <meshStandardMaterial color="#8a908d" roughness={0.9} />
                  </mesh>
                  <mesh position={[0, -0.36, 0]} castShadow>
                    <boxGeometry args={[1.2, 0.4, 1.2]} />
                    <meshStandardMaterial color="#6e7678" roughness={0.95} />
                  </mesh>
                </group>
              )}

              {type === 'river' && unlocked && (
                <mesh position={[0, 0.05, 0]}>
                  <boxGeometry args={[0.9, 0.08, 0.9]} />
                  <meshStandardMaterial color="#5ad5ff" transparent opacity={0.8} roughness={0.2} />
                </mesh>
              )}

              {building && unlocked && (
                <BuildingModel
                  type={building.type}
                  color={buildingCatalog[building.type].color}
                  position={[0, 0.26, 0]}
                />
              )}

              {isSelected && unlocked && (
                <mesh position={[0, 0.18, 0]}>
                  <ringGeometry args={[0.38, 0.5, 24]} />
                  <meshStandardMaterial color="#d8ffe4" emissive="#8df3a7" emissiveIntensity={0.5} />
                </mesh>
              )}
            </group>
          );
        })
      )}

      {crops.map((crop) => (
        <group key={crop.id} position={[crop.col - MAP_SIZE / 2 + 0.5, 0.15, crop.row - MAP_SIZE / 2 + 0.5]}>
          <mesh position={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[0.6, 0.16, 0.6]} />
            <meshStandardMaterial color={crop.growth >= 100 ? '#7bc96f' : '#c6a96a'} roughness={1} />
          </mesh>
          <mesh position={[0, 0.38, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 0.5, 12]} />
            <meshStandardMaterial color="#7d573b" roughness={1} />
          </mesh>
          <mesh position={[0, 0.75, 0]} castShadow>
            <sphereGeometry args={[0.22 + (crop.growth / 100) * 0.12, 16, 16]} />
            <meshStandardMaterial color={crop.growth >= 100 ? '#ffd15c' : '#6dd66d'} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {animals.map((animal) => (
        <AnimalModel key={animal.id} animal={animal} />
      ))}

      <BoatModel boat={boat} />

      <group position={playerPosition}>
        <mesh position={[0, 0.75, 0]} castShadow>
          <capsuleGeometry args={[0.34, 1.0, 8, 16]} />
          <meshStandardMaterial color="#dfe8ff" roughness={0.75} />
        </mesh>
        <mesh position={[0.42, 1.2, 0.1]} castShadow>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color="#f5d9bb" roughness={0.9} />
        </mesh>
      </group>

      <Cloud position={[-5, 7, -4]} speed={0.4} opacity={0.5} segments={20} bounds={[3, 1, 2]} />
      <Cloud position={[4, 8, -2]} speed={0.3} opacity={0.45} segments={18} bounds={[3, 1, 2]} />
      <Sparkles count={90} scale={[20, 8, 20]} size={2} speed={0.4} color="#fff6d9" />
    </group>
  );
}

function CameraRig({ target }) {
  const { camera } = useThree();

  useFrame(() => {
    const ideal = new THREE.Vector3(target[0] + 6.2, target[1] + 5.4, target[2] + 7.6);
    camera.position.lerp(ideal, 0.08);
    camera.lookAt(target[0], target[1] + 1, target[2]);
  });

  return null;
}

function App() {
  const [selectedBuild, setSelectedBuild] = useState('cabin');
  const [inventory, setInventory] = useState(initialInventory);
  const [buildings, setBuildings] = useState([
    { id: 1, type: 'cabin', x: 2, y: 2 },
    { id: 2, type: 'field', x: 5, y: 7 },
  ]);
  const [message, setMessage] = useState('Seu mundo começa aqui.');
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(6);
  const [selectedTile, setSelectedTile] = useState({ row: 2, col: 2 });
  const [playerPosition, setPlayerPosition] = useState([0, 0.35, 0]);
  const [crops, setCrops] = useState([
    { id: 1, row: 5, col: 7, growth: 100 },
    { id: 2, row: 1, col: 4, growth: 70 },
  ]);
  const [animals, setAnimals] = useState([
    { id: 1, x: -1.8, z: 2.2, color: '#d5d7d9', rotation: 0.6 },
    { id: 2, x: 1.4, z: -2.7, color: '#c7a07a', rotation: -0.8 },
    { id: 3, x: -2.9, z: -1.4, color: '#a6d08b', rotation: 0.3 },
  ]);
  const [weather, setWeather] = useState('sunny');
  const [territoryLevel, setTerritoryLevel] = useState(1);
  const [boat, setBoat] = useState(null);
  const [onBoat, setOnBoat] = useState(false);
  const keyState = useRef({});

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === 'KeyE' && !event.repeat) {
        toggleBoatEntry();
      }
      keyState.current[event.code] = true;
    };

    const onKeyUp = (event) => {
      keyState.current[event.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    let frameId;

    const tick = () => {
      setPlayerPosition((current) => {
        let [x, y, z] = current;
        const moveX = (keyState.current.KeyD || keyState.current.ArrowRight ? 1 : 0) - (keyState.current.KeyA || keyState.current.ArrowLeft ? 1 : 0);
        const moveZ = (keyState.current.KeyS || keyState.current.ArrowDown ? 1 : 0) - (keyState.current.KeyW || keyState.current.ArrowUp ? 1 : 0);

        if (moveX !== 0 || moveZ !== 0) {
          const length = Math.hypot(moveX, moveZ) || 1;

          if (onBoat && boat) {
            const nextX = boat.x + (moveX / length) * 0.22;
            const nextZ = boat.z + (moveZ / length) * 0.22;
            const row = Math.min(MAP_SIZE - 1, Math.max(0, Math.round(nextZ + MAP_SIZE / 2 - 0.5)));
            const col = Math.min(MAP_SIZE - 1, Math.max(0, Math.round(nextX + MAP_SIZE / 2 - 0.5)));

            if (!isLakeTile(row, col, worldTiles)) {
              setMessage('O barco só navega em águas livres do lago.');
              return current;
            }

            setBoat((currentBoat) => currentBoat ? { ...currentBoat, x: nextX, z: nextZ, row, col, rotation: Math.atan2(moveX, moveZ) } : currentBoat);
            return [nextX, y, nextZ];
          }

          x += (moveX / length) * 0.08;
          z += (moveZ / length) * 0.08;

          x = Math.max(-MAP_SIZE / 2 + 0.8, Math.min(MAP_SIZE / 2 - 0.8, x));
          z = Math.max(-MAP_SIZE / 2 + 0.8, Math.min(MAP_SIZE / 2 - 0.8, z));
        }

        return [x, y, z];
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [boat, onBoat]);

  useEffect(() => {
    const row = Math.min(MAP_SIZE - 1, Math.max(0, Math.round(playerPosition[2] + MAP_SIZE / 2 - 0.5)));
    const col = Math.min(MAP_SIZE - 1, Math.max(0, Math.round(playerPosition[0] + MAP_SIZE / 2 - 0.5)));
    setSelectedTile({ row, col });
  }, [playerPosition]);

  const mapTiles = useMemo(() => worldTiles, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHour((current) => {
        const next = current + 1;
        if (next >= 24) {
          setDay((d) => d + 1);
          growCrops();
          setMessage('O vale acorda com mais vida e as plantações avançam.');
          return 6;
        }

        if (current % 4 === 0) {
          growCrops();
        }

        return next;
      });
    }, 2400);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const newWeather = hour >= 18 || hour <= 6 ? 'sunset' : hour >= 12 ? 'sunny' : 'cloudy';
      if (day % 3 === 0 && hour >= 8 && hour <= 16) {
        setWeather('rain');
      } else {
        setWeather(newWeather);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [day, hour]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimals((current) =>
        current.map((animal, index) => ({
          ...animal,
          x: Math.max(-4.2, Math.min(4.2, animal.x + Math.sin((Date.now() / 900) + index) * 0.01)),
          z: Math.max(-4.2, Math.min(4.2, animal.z + Math.cos((Date.now() / 700) + index) * 0.01)),
          rotation: animal.rotation + 0.02,
        }))
      );
    }, 75);

    return () => clearInterval(timer);
  }, []);

  const canAfford = (cost) => {
    return Object.entries(cost).every(([key, value]) => (inventory[key] ?? 0) >= value);
  };

  const toggleBoatEntry = () => {
    if (!boat) {
      setMessage('Primeiro, coloque um barco em um ponto do lago.');
      return;
    }

    const distance = Math.hypot(playerPosition[0] - boat.x, playerPosition[2] - boat.z);
    if (distance > 1.5) {
      setMessage('Você precisa se aproximar do barco para entrar nele.');
      return;
    }

    setOnBoat((current) => {
      const next = !current;
      if (next) {
        setPlayerPosition([boat.x, 0.35, boat.z]);
      }
      setMessage(next ? 'Você entrou no barco e a navegação ficou ativa.' : 'Você saiu do barco e voltou a andar.');
      return next;
    });
  };

  const spend = (cost) => {
    setInventory((current) => ({
      ...current,
      ...Object.fromEntries(
        Object.entries(cost).map(([key, value]) => [key, (current[key] ?? 0) - value])
      ),
    }));
  };

  const collectResource = (type) => {
    if (type === 'tree') {
      setInventory((current) => ({ ...current, wood: current.wood + 2 }));
      setMessage('Você coletou madeira do vale.');
    }
    if (type === 'rock') {
      setInventory((current) => ({ ...current, stone: current.stone + 2 }));
      setMessage('Você encontrou pedra nobre.');
    }
    if (type === 'river') {
      setInventory((current) => ({ ...current, water: current.water + 3 }));
      setMessage('Água fresca foi recolhida.');
    }
  };

  const placeBuilding = (row, col) => {
    const type = selectedBuild;
    const cost = buildingCatalog[type].cost;

    if (!canAfford(cost)) {
      setMessage('Você precisa de mais recursos para construir.');
      return;
    }

    const occupied = buildings.some((b) => b.x === row && b.y === col);
    if (occupied) {
      setMessage('Esse espaço já está ocupado.');
      return;
    }

    spend(cost);
    setBuildings((current) => [...current, { id: Date.now(), type, x: row, y: col }]);
    setMessage(`${buildingCatalog[type].label} construída com sucesso.`);
  };

  const placeBoatOnTile = (row, col) => {
    const cost = buildingCatalog.boat.cost;

    if (!canAfford(cost)) {
      setMessage('Você precisa de mais madeira para construir o barco.');
      return;
    }

    if (!isLakeTile(row, col, worldTiles)) {
      setMessage('O barco deve ser colocado em um ponto do lago.');
      return;
    }

    if (boat) {
      setMessage('Já existe um barco no lago.');
      return;
    }

    spend(cost);
    setBoat({
      id: Date.now(),
      row,
      col,
      x: col - MAP_SIZE / 2 + 0.5,
      z: row - MAP_SIZE / 2 + 0.5,
      rotation: 0,
    });
    setOnBoat(false);
    setMessage('Barco posicionado no lago. Aproxime-se e pressione E para entrar.');
  };

  const placeDeckOnTile = (row, col) => {
    const cost = buildingCatalog.deck.cost;

    if (!canAfford(cost)) {
      setMessage('Você precisa de mais madeira e pedra para montar o deck.');
      return;
    }

    if (!isLakeTile(row, col, worldTiles)) {
      setMessage('O deck deve ser construído em uma parte do lago para atracar o barco.');
      return;
    }

    const occupied = buildings.some((b) => b.x === row && b.y === col && b.type === 'deck');
    if (occupied) {
      setMessage('Esse ponto do lago já tem um deck.');
      return;
    }

    spend(cost);
    setBuildings((current) => [...current, { id: Date.now(), type: 'deck', x: row, y: col }]);
    setMessage('Deck pronto no lago para estacionar o barco.');
  };

  const addProduction = () => {
    const readyCrops = crops.filter((crop) => crop.growth >= 100).length;
    setInventory((current) => ({
      ...current,
      grain: current.grain + Math.max(1, readyCrops),
      food: current.food + Math.max(1, readyCrops),
      water: current.water + 1,
    }));
    setMessage('A produção da fazenda foi aumentada.');
  };

  const placeCrop = (row, col) => {
    const occupied = crops.some((crop) => crop.row === row && crop.col === col);
    if (occupied) {
      setMessage('Essa área já está plantada.');
      return;
    }

    setCrops((current) => [...current, { id: Date.now(), row, col, growth: 12 }]);
    setMessage('Plantação iniciada com sucesso.');
  };

  const harvestCrop = (row, col) => {
    const crop = crops.find((item) => item.row === row && item.col === col);
    if (!crop) return;

    if (crop.growth < 100) {
      setMessage('A plantação ainda está em crescimento.');
      return;
    }

    setCrops((current) => current.filter((item) => !(item.row === row && item.col === col)));
    setInventory((current) => ({
      ...current,
      grain: current.grain + 5,
      food: current.food + 3,
    }));
    setMessage('Colheita concluída! Grãos e alimentos foram armazenados.');
  };

  const growCrops = () => {
    setCrops((current) =>
      current.map((crop) => {
        const nextGrowth = Math.min(100, crop.growth + 22);
        return { ...crop, growth: nextGrowth };
      })
    );
  };

  const handleTileClick = (row, col, type) => {
    setSelectedTile({ row, col });

    const cropOnTile = crops.find((crop) => crop.row === row && crop.col === col);
    if (cropOnTile) {
      harvestCrop(row, col);
      return;
    }

    if (selectedBuild === 'boat') {
      placeBoatOnTile(row, col);
      return;
    }

    if (selectedBuild === 'deck') {
      placeDeckOnTile(row, col);
      return;
    }

    if (type === 'tree') collectResource('tree');
    if (type === 'rock') collectResource('rock');
    if (type === 'river') collectResource('river');
    if (type !== 'tree' && type !== 'rock' && type !== 'river') {
      if (selectedBuild === 'field') {
        placeCrop(row, col);
        return;
      }
      placeBuilding(row, col);
    }
  };

  const buildingStats = useMemo(
    () =>
      buildings.reduce(
        (acc, building) => {
          acc[building.type] = (acc[building.type] ?? 0) + 1;
          return acc;
        },
        {}
      ),
    [buildings]
  );

  const biomeScore = Math.min(100, 58 + buildings.length * 8 + inventory.wood / 4);
  const soilHealth = Math.min(100, 64 + inventory.grain * 2 + Math.max(0, buildingStats.field ?? 0) * 10);
  const weatherLabel = weather === 'sunny' ? 'Ensolarado' : weather === 'rain' ? 'Chuva leve' : weather === 'cloudy' ? 'Nublado' : 'Pôr do sol';
  const territoryRadius = 1 + territoryLevel;
  const territoryCost = { wood: 10 + territoryLevel * 4, stone: 6 + territoryLevel * 3 };
  const territoryProgress = Math.min(100, (buildings.length * 15) + (inventory.wood / 2));

  const isTileUnlocked = (row, col) => {
    const center = Math.floor(MAP_SIZE / 2);
    const distance = Math.abs(row - center) + Math.abs(col - center);
    return distance <= territoryRadius;
  };

  const expandTerritory = () => {
    if (!canAfford(territoryCost)) {
      setMessage('Você precisa de mais madeira e pedra para expandir o território.');
      return;
    }

    spend(territoryCost);
    setTerritoryLevel((current) => current + 1);
    setMessage('Nova faixa do vale foi aberta para a sua fazenda.');
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-panel">
          <span className="brand-tag">Mundo</span>
          <h1>Vale Verde</h1>
        </div>

        <div className="top-stats">
          <div className="mini-stat">
            <span>Dia</span>
            <strong>{day}</strong>
          </div>
          <div className="mini-stat">
            <span>Hora</span>
            <strong>{hour}:00</strong>
          </div>
          <div className="mini-stat">
            <span>Clima</span>
            <strong>{weatherLabel}</strong>
          </div>
          <div className="mini-stat">
            <span>Território</span>
            <strong>{territoryLevel}</strong>
          </div>
          <div className="mini-stat">
            <span>Nível</span>
            <strong>12</strong>
          </div>
        </div>
      </header>

      <main className="game-layout">
        <aside className="panel left-panel">
          <div className="panel-header">
            <span>Inventário</span>
          </div>

          <div className="resource-list">
            <div className="resource-item"><span>Madeira</span><strong>{inventory.wood}</strong></div>
            <div className="resource-item"><span>Pedra</span><strong>{inventory.stone}</strong></div>
            <div className="resource-item"><span>Grãos</span><strong>{inventory.grain}</strong></div>
            <div className="resource-item"><span>Comida</span><strong>{inventory.food}</strong></div>
            <div className="resource-item"><span>Água</span><strong>{inventory.water}</strong></div>
          </div>

          <div className="status-grid">
            <div className="status-card">
              <span>Bioma</span>
              <strong>{Math.round(biomeScore)}%</strong>
            </div>
            <div className="status-card">
              <span>Solo</span>
              <strong>{Math.round(soilHealth)}%</strong>
            </div>
            <div className="status-card">
              <span>Vida</span>
              <strong>Alta</strong>
            </div>
          </div>

          <div className="territory-card">
            <div className="territory-header">
              <span>Expansão</span>
              <strong>{territoryLevel}</strong>
            </div>
            <div className="progress-bar">
              <span className="progress-fill" style={{ width: `${territoryProgress}%` }} />
            </div>
            <p>Território atual: {territoryRadius * 2 + 2} km²</p>
          </div>

          <div className="panel-header secondary">
            <span>Construções</span>
          </div>
          <div className="build-summary">
            {Object.entries(buildingCatalog).map(([key, value]) => (
              <div className="summary-row" key={key}>
                <span>{value.label}</span>
                <strong>{buildingStats[key] ?? 0}</strong>
              </div>
            ))}
          </div>

          <div className="panel-header secondary">
            <span>Colheita</span>
          </div>
          <div className="build-summary">
            <div className="summary-row">
              <span>Plantios ativos</span>
              <strong>{crops.length}</strong>
            </div>
            <div className="summary-row">
              <span>Prontos</span>
              <strong>{crops.filter((crop) => crop.growth >= 100).length}</strong>
            </div>
          </div>
        </aside>

        <section className="world-panel">
          <div className="battle-topbar">
            <span>Região: Vale Verde</span>
            <span>Território: 24.000m²</span>
          </div>

          <div className="world-header">
            <div>
              <span className="eyebrow">Terreno</span>
              <h2>Fazenda do vale</h2>
            </div>
            <div className="tile-info">
              <span>Modo</span>
              <strong>{onBoat ? 'Navegando' : 'Andando'}</strong>
            </div>
          </div>

          <div className="territory-banner">
            <div>
              <span>Território em expansão</span>
              <strong>Vale em {territoryLevel}.0</strong>
            </div>
            <button type="button" className="action-button accent" onClick={expandTerritory}>Expandir</button>
          </div>

          <div className="world-viewport">
            <Canvas camera={{ position: [8, 8, 9], fov: 42 }} shadows>
              <color attach="background" args={weather === 'rain' ? ['#abd0e8'] : weather === 'sunset' ? ['#f7c99b'] : ['#b9e8ff']} />
              <fog attach="fog" args={weather === 'rain' ? ['#c7dceb', 9, 22] : ['#dfefff', 9, 22]} />
              <WeatherSystem mode={weather} />
              <Sky
                distance={450000}
                sunPosition={weather === 'sunset' ? [4, 1.2, 3] : [8, 3, 2]}
                inclination={weather === 'sunset' ? 0.8 : 0.62}
                azimuth={0.18}
              />
              <WorldScene
                tiles={mapTiles}
                buildings={buildings}
                selectedTile={selectedTile}
                playerPosition={playerPosition}
                crops={crops}
                animals={animals}
                weather={weather}
                onTileClick={handleTileClick}
                isTileUnlocked={isTileUnlocked}
                boat={boat}
              />
              <CameraRig target={playerPosition} />
            </Canvas>
          </div>

          <div className="bottom-actions">
            {Object.entries(buildingCatalog).map(([key, value]) => (
              <button
                key={key}
                type="button"
                className={`action-button ${selectedBuild === key ? 'selected' : ''}`}
                onClick={() => setSelectedBuild(key)}
              >
                <span className="swatch" style={{ background: value.color }} />
                {value.label}
              </button>
            ))}
            <button type="button" className="action-button accent" onClick={addProduction}>Produzir</button>
            <button type="button" className="action-button" onClick={expandTerritory}>+ Expandir território</button>
          </div>
        </section>

        <aside className="panel right-panel">
          <div className="panel-header">
            <span>Missões</span>
          </div>

          <div className="quest-box">
            <h3>Fazenda do Vale</h3>
            <p>Transforme a terra fértil em um reino sereno, produtivo e próspero.</p>
          </div>

          <div className="quest-list">
            <div className="quest-item">
              <span className="quest-status live" />
              <div>
                <strong>Estoque de madeira</strong>
                <small>Recursos em expansão</small>
              </div>
            </div>
            <div className="quest-item">
              <span className="quest-status active" />
              <div>
                <strong>Produção da plantação</strong>
                <small>Grãos e alimentos em crescimento</small>
              </div>
            </div>
            <div className="quest-item">
              <span className="quest-status idle" />
              <div>
                <strong>Expansão do território</strong>
                <small>Próximo avanço em {territoryCost.wood} madeira / {territoryCost.stone} pedra</small>
              </div>
            </div>
          </div>

          <div className="panel-header secondary">
            <span>Atividade</span>
          </div>

          <div className="log-box">
            <p>{message}</p>
            <ul>
              <li>Trilha de árvores ao norte</li>
              <li>Rio limpo para água</li>
              <li>Solo fértil e estável</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
