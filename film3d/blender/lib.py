"""Film toolkit: character loading (Rocketbox), animation, props, lights, render settings."""
import bpy, os, math
_FILM3D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_REPO = os.path.dirname(_FILM3D)
from mathutils import Vector

RB = os.environ.get("FILM_RB", os.path.join(_FILM3D, "assets/rb"))
PH = os.environ.get("FILM_PH", os.path.join(_REPO, "public/projects/story3d/models"))
STUDIO = bpy.utils.system_resource("DATAFILES", path="studiolights/world")


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = 24
    return sc


def _img(path):
    if not os.path.exists(path):
        return None
    return bpy.data.images.load(path, check_existing=True)


def _pbr(mat, color, normal=None, spec=None, alpha=None, sss=0.0, rough=0.55):
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(b.outputs[0], out.inputs[0])
    tc = nt.nodes.new("ShaderNodeTexImage"); tc.image = _img(color)
    nt.links.new(tc.outputs["Color"], b.inputs["Base Color"])
    if normal and _img(normal):
        tn = nt.nodes.new("ShaderNodeTexImage"); tn.image = _img(normal); tn.image.colorspace_settings.name = "Non-Color"
        nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 0.8
        nt.links.new(tn.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs[0], b.inputs["Normal"])
    if spec and _img(spec):
        ts = nt.nodes.new("ShaderNodeTexImage"); ts.image = _img(spec); ts.image.colorspace_settings.name = "Non-Color"
        mr = nt.nodes.new("ShaderNodeMapRange")
        mr.inputs["To Min"].default_value = rough + 0.25; mr.inputs["To Max"].default_value = max(0.2, rough - 0.25)
        nt.links.new(ts.outputs["Color"], mr.inputs["Value"]); nt.links.new(mr.outputs[0], b.inputs["Roughness"])
    else:
        b.inputs["Roughness"].default_value = rough
    if alpha:
        ta = nt.nodes.new("ShaderNodeTexImage"); ta.image = _img(alpha)
        if ta.image:
            src = ta.outputs["Alpha"] if ta.image.depth in (32, 64, 128) and ta.image.channels == 4 else ta.outputs["Color"]
            nt.links.new(src, b.inputs["Alpha"])
            nt.links.new(ta.outputs["Color"], b.inputs["Base Color"])
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
        b.inputs["Subsurface Radius"].default_value = (1.0, 0.35, 0.2)
        b.inputs["Subsurface Scale"].default_value = 0.012
    return b


def load_character(name, sub="Adults", facial=True, subsurf=1):
    """Import a Rocketbox avatar. Returns (armature, mesh)."""
    folder = f"{RB}/{name}"
    fbx = f"{folder}/Export/{name}{'_facial' if facial else ''}.fbx"
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=fbx, use_anim=False)
    new = [o for o in bpy.data.objects if o not in before]
    arm = next(o for o in new if o.type == "ARMATURE")
    mesh = max((o for o in new if o.type == "MESH"), key=lambda o: len(o.data.vertices))
    for o in new:
        if o.type == "MESH" and o is not mesh:
            o.hide_render = True; o.hide_viewport = True
    tex = f"{folder}/Textures"
    files = os.listdir(tex)
    def f(suffix):
        m = [x for x in files if x.endswith(suffix) and " - " not in x]
        return f"{tex}/{m[0]}" if m else None
    for slot in mesh.material_slots:
        mat = slot.material
        n = mat.name.lower()
        if "head" in n:
            _pbr(mat, f("head_color.tga"), f("head_normal.tga"), f("head_specular.tga"), sss=0.12, rough=0.5)
        elif "opacity" in n:
            b = _pbr(mat, f("opacity_color.tga"), alpha=f("opacity_color.tga"), rough=0.92)
            b.inputs["Specular IOR Level"].default_value = 0.15
            mat.blend_method = "HASHED" if hasattr(mat, "blend_method") else None
        else:
            _pbr(mat, f("body_color.tga"), f("body_normal.tga"), f("body_specular.tga"), sss=0.05, rough=0.7)
    if subsurf:
        m = mesh.modifiers.new("sub", "SUBSURF"); m.levels = 0; m.render_levels = subsurf
    mesh.name = name; arm.name = name + "_rig"
    root = bpy.data.objects.new(name + "_root", None); bpy.context.scene.collection.objects.link(root)
    arm.parent = root; arm.matrix_parent_inverse.identity()
    arm["driver"] = ""
    return arm, mesh, root


_action_cache = {}

def get_action(anim):
    if anim in _action_cache:
        return _action_cache[anim]
    before_o = set(bpy.data.objects); before_a = set(bpy.data.actions)
    bpy.ops.import_scene.fbx(filepath=f"{RB}/anims/{anim}.fbx")
    new_a = [a for a in bpy.data.actions if a not in before_a]
    act = max(new_a, key=lambda a: sum(len(cb.fcurves) for cb in a.layers[0].strips[0].channelbags))
    act.name = anim; act.use_fake_user = True
    for o in [o for o in bpy.data.objects if o not in before_o]:
        bpy.data.objects.remove(o, do_unlink=True)
    _action_cache[anim] = act
    return act


def play(arm, clips):
    """clips: list of (anim_name, start_frame, clip_in, clip_out, blend_frames). NLA strips with blending."""
    arm.animation_data_create()
    ad = arm.animation_data
    for i, (anim, start, cin, cout, blend) in enumerate(clips):
        act = get_action(anim)
        tr = ad.nla_tracks.new(); tr.name = f"t{i}"
        st = tr.strips.new(anim, int(start), act)
        st.action_frame_start = cin; st.action_frame_end = cout
        st.frame_end = start + (cout - cin)
        st.blend_in = blend if i else 0
        st.extrapolation = "HOLD_FORWARD" if i == len(clips) - 1 else "HOLD_FORWARD"
        st.blend_type = "REPLACE"
        # slot binding for Blender 4.4+ slotted actions
        try:
            if act.slots:
                st.action_slot = act.slots[0]
        except Exception:
            pass
    return ad


def shape(mesh, key, frames_vals):
    """Keyframe a shape key: frames_vals = [(frame, value), ...]."""
    kb = mesh.data.shape_keys.key_blocks.get(key)
    if kb is None:
        cands = [k.name for k in mesh.data.shape_keys.key_blocks if key.lower() in k.name.lower()]
        if not cands:
            print("missing shape", key); return
        kb = mesh.data.shape_keys.key_blocks[cands[0]]
    for fr, v in frames_vals:
        kb.value = v; kb.keyframe_insert("value", frame=fr)


def import_gltf(path, loc=(0, 0, 0), rot=0.0, scale=1.0, name=None):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new(name or os.path.basename(path), None)
    bpy.context.scene.collection.objects.link(root)
    for o in new:
        if o.parent is None:
            o.parent = root
    root.location = loc; root.rotation_euler = (0, 0, rot); root.scale = (scale,) * 3
    return root, new


def ph(name, **kw):
    return import_gltf(f"{PH}/{name}/{name}_1k.gltf", name=name, **kw)


def bbox(objs):
    bpy.context.view_layer.update()
    pts = []
    for o in objs:
        if o.type == "MESH":
            pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx


def world_hdri(name="interior", strength=0.3, rot=0.0):
    w = bpy.data.worlds.new("w"); bpy.context.scene.world = w; w.use_nodes = True
    nt = w.node_tree; bg = nt.nodes["Background"]
    env = nt.nodes.new("ShaderNodeTexEnvironment"); env.image = bpy.data.images.load(f"{STUDIO}/{name}.exr")
    mp = nt.nodes.new("ShaderNodeMapping"); tc = nt.nodes.new("ShaderNodeTexCoord")
    mp.inputs["Rotation"].default_value[2] = rot
    nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"]); nt.links.new(mp.outputs[0], env.inputs[0])
    nt.links.new(env.outputs[0], bg.inputs[0]); bg.inputs[1].default_value = strength
    return w


def area(name, loc, target, power, size=1.0, color=(1, 1, 1), shape="RECTANGLE", size_y=None):
    L = bpy.data.lights.new(name, "AREA"); L.energy = power; L.size = size; L.color = color
    L.shape = shape
    if size_y: L.size_y = size_y
    o = bpy.data.objects.new(name, L); bpy.context.scene.collection.objects.link(o)
    o.location = loc; look_at(o, target); return o


def point(name, loc, power, color=(1, 1, 1), radius=0.05):
    L = bpy.data.lights.new(name, "POINT"); L.energy = power; L.color = color; L.shadow_soft_size = radius
    o = bpy.data.objects.new(name, L); bpy.context.scene.collection.objects.link(o); o.location = loc; return o


def spot(name, loc, target, power, angle=60, blend=0.5, color=(1, 1, 1), radius=0.05):
    L = bpy.data.lights.new(name, "SPOT"); L.energy = power; L.color = color; L.spot_size = math.radians(angle); L.spot_blend = blend; L.shadow_soft_size = radius
    o = bpy.data.objects.new(name, L); bpy.context.scene.collection.objects.link(o); o.location = loc; look_at(o, target); return o


def look_at(o, target):
    d = Vector(target) - Vector(o.location)
    o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def camera(name="cam", lens=35, sensor=36):
    c = bpy.data.cameras.new(name); c.lens = lens; c.sensor_width = sensor; c.sensor_fit = "HORIZONTAL"
    o = bpy.data.objects.new(name, c); bpy.context.scene.collection.objects.link(o)
    bpy.context.scene.camera = o
    return o


def key_cam(cam, frame, loc, target, lens=None, focus=None, fstop=None):
    cam.location = loc; look_at(cam, target)
    cam.keyframe_insert("location", frame=frame); cam.keyframe_insert("rotation_euler", frame=frame)
    if lens:
        cam.data.lens = lens; cam.data.keyframe_insert("lens", frame=frame)
    if focus is not None:
        cam.data.dof.use_dof = True; cam.data.dof.focus_distance = focus; cam.data.dof.keyframe_insert("focus_distance", frame=frame)
    if fstop:
        cam.data.dof.aperture_fstop = fstop


def render_settings(w=720, h=1280, engine="CYCLES", samples=24, pct=100, mblur=False):
    sc = bpy.context.scene
    sc.render.resolution_x = w; sc.render.resolution_y = h; sc.render.resolution_percentage = pct
    sc.render.engine = engine
    if engine == "CYCLES":
        sc.cycles.device = "CPU"; sc.cycles.samples = samples; sc.cycles.use_denoising = True
        sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.03
        sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 2
        sc.cycles.transparent_max_bounces = 8; sc.cycles.transmission_bounces = 2
        sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
        sc.cycles.blur_glossy = 1.0
        sc.render.use_persistent_data = True
        try:
            sc.cycles.denoiser = "OPENIMAGEDENOISE"
        except Exception:
            pass
    else:
        sc.eevee.taa_render_samples = samples
    sc.render.use_motion_blur = mblur
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"
    sc.render.image_settings.file_format = "JPEG"; sc.render.image_settings.quality = 92
    sc.render.film_transparent = False


RAW_CONV_Z = 1.786  # raw Rocketbox anim space (cm, floor at -178.6) -> metres, floor at 0


def drive(arm, root, clips, name=None):
    """Import a driver skeleton, play the clips on it (NLA), and make the avatar copy its world pose.
    clips: list of (anim, start, clip_in, clip_out, blend)."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=f"{RB}/anims/{clips[0][0]}.fbx")
    new = [o for o in bpy.data.objects if o not in before]
    drv = next(o for o in new if o.type == "ARMATURE")
    for o in new:
        if o is not drv:
            bpy.data.objects.remove(o, do_unlink=True)
    drv.animation_data_clear()
    conv = bpy.data.objects.new((name or arm.name) + "_drvconv", None); bpy.context.scene.collection.objects.link(conv)
    conv.parent = root; conv.scale = (0.01, 0.01, 0.01); conv.location = (0, 0, RAW_CONV_Z)
    drv.parent = conv; drv.matrix_parent_inverse.identity()
    drv.hide_render = True
    play(drv, clips)
    for pb in arm.pose.bones:
        if pb.name not in drv.pose.bones:
            continue
        c = pb.constraints.new("COPY_ROTATION"); c.target = drv; c.subtarget = pb.name
        c.target_space = "WORLD"; c.owner_space = "WORLD"
        if pb.name in ("Bip01 Pelvis", "Bip01"):
            c2 = pb.constraints.new("COPY_LOCATION"); c2.target = drv; c2.subtarget = pb.name
            c2.target_space = "WORLD"; c2.owner_space = "WORLD"
    # auto-ground: lowest avatar foot joint at ankle height on the first clip frame
    sc = bpy.context.scene; cur = sc.frame_current
    conv.location.z = RAW_CONV_Z
    sc.frame_set(int(clips[0][1]) + 5); bpy.context.view_layer.update()
    fz = min((arm.matrix_world @ arm.pose.bones[b].head).z for b in ("Bip01 L Foot", "Bip01 R Foot"))
    conv.location.z -= (fz - 0.095); sc.frame_set(cur)
    return drv


def world_sky(sun_elev_deg=4.0, sun_rot_deg=180.0, strength=0.35, air=1.0):
    w = bpy.data.worlds.new("sky"); bpy.context.scene.world = w; w.use_nodes = True
    nt = w.node_tree; bg = nt.nodes["Background"]
    sk = nt.nodes.new("ShaderNodeTexSky")
    try:
        sk.sky_type = "NISHITA"
    except Exception:
        pass
    for attr, v in (("sun_elevation", math.radians(sun_elev_deg)), ("sun_rotation", math.radians(sun_rot_deg)), ("air_density", air), ("dust_density", 2.0), ("sun_intensity", 0.6)):
        if hasattr(sk, attr): setattr(sk, attr, v)
    nt.links.new(sk.outputs[0], bg.inputs[0]); bg.inputs[1].default_value = strength
    return w
