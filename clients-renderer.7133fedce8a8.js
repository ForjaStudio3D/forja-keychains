import * as T from './vendor/three.module.0a3368c165ee.js';

export async function createClientsViewer(canvas) {
  const renderer = new T.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.autoClear = false;
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-50, 50, 50, -50, .1, 500);
  camera.position.z = 160;
  scene.add(new T.HemisphereLight(0xffffff, 0x667080, 1.8));
  // Studio lights stay in front of the viewer while the object rotates.
  const key = new T.DirectionalLight(0xffffff, 2.6);
  key.position.set(-65, 85, 100);
  scene.add(key);
  const fill = new T.DirectionalLight(0xffffff, .8);
  fill.position.set(70, 15, 90);
  scene.add(fill);
  const sources = ['client-maratona-exterior-v26', 'client-mirim-exterior-v26', 'client-infoeste-exterior-v26', 'client-linux-exterior-v26'];
  const colors = ['#C8202D', '#1B4FD8', '#168C49', '#1A1A1A'];
  const models = await Promise.all(sources.map(async (name, index) => {
    const [dataResponse, metaResponse] = await Promise.all([fetch(`assets/${name}.dat`), fetch(`assets/${name}.json`)]);
    if (!dataResponse.ok || !metaResponse.ok) throw Error('Client model unavailable');
    const [data, meta] = await Promise.all([dataResponse.arrayBuffer(), metaResponse.json()]);
    const buffer = new T.InterleavedBuffer(new Float32Array(data), 6);
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.InterleavedBufferAttribute(buffer, 3, 0));
    geometry.setAttribute('normal', new T.InterleavedBufferAttribute(buffer, 3, 3));
    meta.groups.forEach(group => geometry.addGroup(group.start, group.count, group.materialIndex));
    geometry.computeBoundingSphere();
    const center = geometry.boundingSphere.center;
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.computeBoundingSphere();
    const materials = meta.materials.map(color => new T.MeshStandardMaterial({color: color === 'CORPO' ? colors[index] : color, roughness: .85, metalness: 0}));
    const mesh = new T.Mesh(geometry, materials);
    mesh.visible = false;
    scene.add(mesh);
    return {mesh, radius: geometry.boundingSphere.radius};
  }));
  let width = 0, height = 0;
  return {
    draw(position, panels, angles) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      if (width !== rect.width || height !== rect.height) {
        width = rect.width; height = rect.height;
        renderer.setSize(width, height, false);
      }
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, width, height);
      renderer.clear();
      renderer.setScissorTest(true);
      panels.forEach(panel => {
        const left = Math.max(0, panel.x), right = Math.min(width, panel.x + panel.width);
        if (right <= left) return;
        const model = models[panel.index];
        const aspect = panel.width / height;
        const halfHeight = model.radius * 1.2 / Math.min(1, aspect);
        camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
        camera.top = halfHeight; camera.bottom = -halfHeight;
        camera.updateProjectionMatrix();
        renderer.setViewport(panel.x, 0, panel.width, height);
        renderer.setScissor(left, 0, right - left, height);
        renderer.clearDepth();
        model.mesh.visible = true;
        model.mesh.rotation.set(angles[panel.index].pitch, angles[panel.index].yaw, 0);
        renderer.render(scene, camera);
        model.mesh.visible = false;
      });
      renderer.setScissorTest(false);
      canvas.dataset.position = position.toFixed(4);
      canvas.dataset.yaws = angles.map(a => a.yaw.toFixed(4)).join(',');
      canvas.dataset.pitches = angles.map(a => a.pitch.toFixed(4)).join(',');
    },
    dispose() {
      models.forEach(({mesh}) => {mesh.geometry.dispose(); mesh.material.forEach(m => m.dispose());});
      renderer.dispose();
    }
  };
}
