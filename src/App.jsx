import { Canvas } from '@react-three/fiber'

import { OrbitControls, Environment, AccumulativeShadows, RandomizedLight, Lightformer } from '@react-three/drei'

import './App.css'


import { Snake } from './components/Snake'

function Scene() {
  return (

    <>

      <color attach="background" args={['#15151a']} />
      <ambientLight intensity={0.1} />
      <directionalLight position={[1, 2, 3]} intensity={1.5} castShadow />
      <Environment resolution={32}>

        <group rotation={[-Math.PI / 4, -0.3, 0]}>

          <Lightformer intensity={20} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[10, 2, 1]} />
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[10, 1, 0]} scale={[20, 2, 1]} />

        </group>

      </Environment>
      <AccumulativeShadows temporal frames={100} color="#316d39" colorBlend={0.5} opacity={1} scale={10} position={[0, -0.01, 0]}>
        <RandomizedLight amount={8} radius={5} ambient={0.5} position={[5, 5, -10]} bias={0.001} />

      </AccumulativeShadows>

      <Snake />uest.

## License

This project is licensed nder th MIT Licene - see the LICENSE file for deails

    </>
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas shadows camera={{ position: [0, 5, 5], fov: 75 }}>
        <Scene />
        <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
      </Canvas>
    </div>
  )
}

export default App
