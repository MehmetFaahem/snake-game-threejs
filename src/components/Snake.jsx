import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, useTexture, useHelper } from '@react-three/drei'
import * as THREE from 'three'

const GRID_SIZE = 200
const POINTS_PER_FOOD = 10
const WALL_HEIGHT = 10
const FOOD_COUNT = 5  // Number of food items on the board
const FOOD_SIZE = 1.2  // Increased food size
const MIN_FOOD_DISTANCE = 20  // Minimum distance between food items
const INITIAL_SNAKE = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 2, y: 0, z: 0 }
]

const LIGHT_SETTINGS = {
  bulbPower: 800, // 60W bulb
  hemiIntensity: 0.5, // Moonlight
  exposure: 0.68
}

export function Snake() {
  const [snakeSegments, setSnakeSegments] = useState(INITIAL_SNAKE)
  const [direction, setDirection] = useState({ x: 1, y: 0, z: 0 })
  const [foods, setFoods] = useState(() => generateMultipleFoods())
  const [score, setScore] = useState(0)
  const [isColliding, setIsColliding] = useState(false)
  const [isBoost, setIsBoost] = useState(false)
  const moveTimer = useRef(0)
  const snakeTexture = useTexture('https://t4.ftcdn.net/jpg/06/37/43/43/360_F_637434324_Pnre61MALzLVkysAd8AXHi6uAJCbg1s6.jpg')
  
  // Lighting setup
  const bulbLightRef = useRef()
  const hemiLightRef = useRef()

  useHelper(bulbLightRef, THREE.PointLightHelper)

  function generateFood() {
    return {
      x: Math.floor(Math.random() * GRID_SIZE - GRID_SIZE / 2),
      y: 0,
      z: Math.floor(Math.random() * GRID_SIZE - GRID_SIZE / 2)
    }
  }

  function isValidFoodPosition(newFood, existingFoods) {
    // Check distance from other food items
    for (const food of existingFoods) {
      const dx = newFood.x - food.x
      const dz = newFood.z - food.z
      const distance = Math.sqrt(dx * dx + dz * dz)
      if (distance < MIN_FOOD_DISTANCE) return false
    }
    return true
  }

  function generateMultipleFoods() {
    const newFoods = []
    while (newFoods.length < FOOD_COUNT) {
      const newFood = generateFood()
      if (isValidFoodPosition(newFood, newFoods)) {
        newFoods.push(newFood)
      }
    }
    return newFoods
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch(e.key) {
        case 'ArrowUp':
          if (direction.z !== 1) setDirection({ x: 0, y: 0, z: -1 })
          break
        case 'ArrowDown':
          if (direction.z !== -1) setDirection({ x: 0, y: 0, z: 1 })
          break
        case 'ArrowLeft':
          if (direction.x !== 1) setDirection({ x: -1, y: 0, z: 0 })
          break
        case 'ArrowRight':
          if (direction.x !== -1) setDirection({ x: 1, y: 0, z: 0 })
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [direction])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') setIsBoost(true)
    }
    const handleKeyUp = (e) => {
      if (e.code === 'Space') setIsBoost(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    moveTimer.current += delta
    const speedMultiplier = isBoost ? 10 : 1
    if (moveTimer.current < 0.2 / speedMultiplier) return // Control snake speed

    moveTimer.current = 0
    const newSegments = [...snakeSegments]
    const head = { ...newSegments[0] }

    head.x += direction.x
    head.z += direction.z

    // Handle boundary collision and wrap-around
    if (head.x > GRID_SIZE/2) {
      head.x = -GRID_SIZE/2
      setIsColliding(true)
      setTimeout(() => setIsColliding(false), 500)
    } else if (head.x < -GRID_SIZE/2) {
      head.x = GRID_SIZE/2
      setIsColliding(true)
      setTimeout(() => setIsColliding(false), 500)
    }
    
    if (head.z > GRID_SIZE/2) {
      head.z = -GRID_SIZE/2
      setIsColliding(true)
      setTimeout(() => setIsColliding(false), 500)
    } else if (head.z < -GRID_SIZE/2) {
      head.z = GRID_SIZE/2
      setIsColliding(true)
      setTimeout(() => setIsColliding(false), 500)
    }

    // Check food collision
    const collidedFoodIndex = foods.findIndex(food => 
      Math.abs(head.x - food.x) < FOOD_SIZE + 2 && 
      Math.abs(head.z - food.z) < FOOD_SIZE + 2
    )

    if (collidedFoodIndex !== -1) {
      const newFoods = [...foods]
      const newFood = generateFood()
      if (isValidFoodPosition(newFood, newFoods.filter((_, i) => i !== collidedFoodIndex))) {
        newFoods[collidedFoodIndex] = newFood
        setFoods(newFoods)
        setScore(prevScore => prevScore + POINTS_PER_FOOD)
        newSegments.push({...newSegments[newSegments.length - 1]})
      }
    } else {
      newSegments.pop()
    }

    newSegments.unshift(head)
    setSnakeSegments(newSegments)
  })

  // Generate grid lines
  const gridLines = []
  for (let i = -GRID_SIZE/2; i <= GRID_SIZE/2; i++) {
    gridLines.push(
      <line key={`x${i}`}>
        <bufferGeometry attach="geometry" >
          <float32BufferAttribute attach="attributes-position" args={[new Float32Array([-GRID_SIZE/2, 0, i, GRID_SIZE/2, 0, i]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color="#2a2a2a" transparent opacity={0.3} />
      </line>,
      <line key={`z${i}`}>
        <bufferGeometry attach="geometry">
          <float32BufferAttribute attach="attributes-position" args={[new Float32Array([i, 0, -GRID_SIZE/2, i, 0, GRID_SIZE/2]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color="#2a2a2a" transparent opacity={0.3} />
      </line>
    )
  }

  return (
    <>
      {/* Lighting */}
      <pointLight
        ref={bulbLightRef}
        position={[0, WALL_HEIGHT * 2, 0]}
        intensity={LIGHT_SETTINGS.bulbPower}
        distance={100}
        decay={2}
        castShadow
      />
      <hemisphereLight
        ref={hemiLightRef}
        intensity={LIGHT_SETTINGS.hemiIntensity}
        position={[0, 50, 0]}
        color="#ddeeff"
        groundColor="#0f0e0d"
      />
      
      {/* Ground plane with grass texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[GRID_SIZE + 2, GRID_SIZE + 2]} />
        <meshStandardMaterial 
          color="#2d5a27" 
          roughness={0.8}
          metalness={0.2}
          envMapIntensity={0.2}
        />
      </mesh>

      {/* Boundary walls */}
      {[
        { pos: [0, WALL_HEIGHT/2, -GRID_SIZE/2-0.5], scale: [GRID_SIZE+2, WALL_HEIGHT, 1] },
        { pos: [0, WALL_HEIGHT/2, GRID_SIZE/2+0.5], scale: [GRID_SIZE+2, WALL_HEIGHT, 1] },
        { pos: [-GRID_SIZE/2-0.5, WALL_HEIGHT/2, 0], scale: [1, WALL_HEIGHT, GRID_SIZE+2] },
        { pos: [GRID_SIZE/2+0.5, WALL_HEIGHT/2, 0], scale: [1, WALL_HEIGHT, GRID_SIZE+2] }
      ].map((wall, index) => (
        <mesh key={`wall-${index}`} position={wall.pos}>
          <boxGeometry args={wall.scale} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}

      {/* Render grid */}
      {gridLines}

      {/* Render score */}
      <Text
        position={[-GRID_SIZE/2, 2, -GRID_SIZE/2]}
        color="white"
        fontSize={0.5}
        anchorX="left"
      >
        Score: {score}
      </Text>

      {/* Render snake as a continuous body */}
      <group>
        {snakeSegments.map((segment, index) => {
          const nextSegment = snakeSegments[index + 1] || segment
          const direction = new THREE.Vector3(
            nextSegment.x - segment.x,
            nextSegment.y - segment.y,
            nextSegment.z - segment.z
          ).normalize()
          
          const rotation = new THREE.Euler()
          rotation.setFromVector3(direction)
          
          return (
            <group key={index} position={[segment.x, segment.y, segment.z]} rotation={[0, -rotation.y, 0]}>
              {index === 0 ? (
                // Head
                <>
                  <mesh>
                    <sphereGeometry args={[3, 16, 16]} />
                    <meshStandardMaterial
                      color={isColliding ? '#ff0000' : '#ffffff'}
                      map={snakeTexture}
                      metalness={0.2}
                      roughness={0.8}
                    />
                  </mesh>
                  <group position={[0, 0.5, 1.5]} rotation={[0, Math.atan2(direction.x, direction.z), 0]}>
                    <mesh position={[-0.8, 0, 0]}>
                      <sphereGeometry args={[1.7]} />
                      <meshStandardMaterial color="#000000" metalness={0.5} roughness={0.2} />
                    </mesh>
                    <mesh position={[0.8, 0, 0]}>
                      <sphereGeometry args={[1.7]} />
                      <meshStandardMaterial color="#000000" metalness={0.5} roughness={0.2} />
                    </mesh>
                  </group>
                </>
              ) : (
                // Body segment
                <mesh>
                  <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
                  <meshStandardMaterial
                    color={isColliding ? '#ff0000' : '#ffffff'}
                    map={snakeTexture}
                    metalness={0.1}
                    roughness={0.6}
                    envMapIntensity={0.5}
                    normalScale={0.5}
                  />
                </mesh>
              )}
            </group>
          )
        })}
      </group>

      {/* Render food as apple or watermelon */}
      {foods.map((food, index) => (
        <group key={`food-${index}`} position={[food.x, food.y + 0.2, food.z]}>
          <mesh>
            <sphereGeometry args={[FOOD_SIZE]} />
            <meshStandardMaterial
              color="#ff0000"
              metalness={0.2}
              roughness={0.8}
              emissive="#440000"
              emissiveIntensity={0.2}
            />
          </mesh>
          <mesh position={[0, FOOD_SIZE + 0.35, 0]} rotation={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.5, 8]} />
            <meshStandardMaterial color="#4a2700" />
          </mesh>
        </group>
      ))}
    </>
  )
}