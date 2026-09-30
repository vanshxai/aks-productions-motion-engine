"""Sets: dev bedroom-office at night, client office at dusk."""
import bpy, math
from mathutils import Vector
from lib import *

import os
PROPS = os.environ.get("FILM_PROPS", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets/props"))
LAP_UV = dict(flip_u=True, flip_v=False, swap=False)
PH_UV = dict(flip_u=False, flip_v=True, swap=True)


def mat_simple(name, color, rough=0.5, metal=0.0, emit=None, emit_strength=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = emit_strength
    return m


def mat_plaster(name, color):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 60; n.inputs["Detail"].default_value = 8
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.05
    nt.links.new(n.outputs["Fac"], bm.inputs["Height"]); nt.links.new(bm.outputs[0], b.inputs["Normal"])
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
    mix.inputs[6].default_value = (*color, 1); mix.inputs[7].default_value = (color[0] * 0.9, color[1] * 0.9, color[2] * 0.88, 1)
    n2 = nt.nodes.new("ShaderNodeTexNoise"); n2.inputs["Scale"].default_value = 3
    nt.links.new(n2.outputs["Fac"], mix.inputs[0]); nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.85
    return m


def mat_wood_floor(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1, 6, 1)
    br = nt.nodes.new("ShaderNodeTexBrick"); br.inputs["Scale"].default_value = 3.2; br.inputs["Mortar Size"].default_value = 0.004
    br.offset = 0.37; br.squash = 1
    br.inputs["Color1"].default_value = (0.30, 0.17, 0.09, 1); br.inputs["Color2"].default_value = (0.22, 0.12, 0.06, 1); br.inputs["Mortar"].default_value = (0.05, 0.03, 0.02, 1)
    wv = nt.nodes.new("ShaderNodeTexWave"); wv.inputs["Scale"].default_value = 18; wv.inputs["Distortion"].default_value = 6; wv.wave_type = "BANDS"
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs[0].default_value = 0.35
    nt.links.new(tc.outputs["Object"], mp.inputs[0]); nt.links.new(mp.outputs[0], br.inputs["Vector"]); nt.links.new(mp.outputs[0], wv.inputs["Vector"])
    nt.links.new(br.outputs["Color"], mix.inputs[6]); nt.links.new(wv.outputs["Color"], mix.inputs[7])
    nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.35
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.15
    nt.links.new(br.outputs["Fac"], bm.inputs["Height"]); nt.links.new(bm.outputs[0], b.inputs["Normal"])
    return m


def plane(name, size, loc, rot, mat):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.scale = (size[0], size[1], 1)
    o.data.materials.append(mat); return o


def screen_mat(name, image_path=None, strength=3.0, seq_frames=0, seq_start=1, uv_rect=None, rot90=False):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = strength
    gl = nt.nodes.new("ShaderNodeBsdfGlossy"); gl.inputs["Roughness"].default_value = 0.08
    gl.inputs["Color"].default_value = (0.04, 0.04, 0.045, 1)
    add = nt.nodes.new("ShaderNodeAddShader")
    nt.links.new(em.outputs[0], add.inputs[0]); nt.links.new(gl.outputs[0], add.inputs[1]); nt.links.new(add.outputs[0], out.inputs[0])
    if image_path:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(image_path)
        t.extension = "CLIP" if uv_rect else "EXTEND"
        if uv_rect:
            u0, u1, v0, v1 = uv_rect
            uvn = nt.nodes.new("ShaderNodeUVMap"); uvn.uv_map = "proj"; mp = nt.nodes.new("ShaderNodeMapping")
            mp.inputs["Location"].default_value = (-u0 / (u1 - u0), -v0 / (v1 - v0), 0)
            mp.inputs["Scale"].default_value = (1 / (u1 - u0), 1 / (v1 - v0), 1)
            nt.links.new(uvn.outputs[0], mp.inputs[0]); nt.links.new(mp.outputs[0], t.inputs[0])
        if seq_frames:
            t.image.source = "SEQUENCE"; t.image_user.frame_duration = seq_frames; t.image_user.frame_start = seq_start
            t.image_user.use_auto_refresh = True
        nt.links.new(t.outputs["Color"], em.inputs["Color"])
        m["tex"] = t.name
    else:
        em.inputs["Color"].default_value = (0.02, 0.02, 0.03, 1)
    return m


def laptop(loc, rot=0.0, screen=None):
    root, objs = import_gltf(f"{PROPS}/laptop.glb", loc=loc, rot=rot, name="laptop")
    frame = next(o for o in objs if o.name.startswith("Frame")); scr = next(o for o in objs if o.name.startswith("Screen"))
    alu = mat_simple("alu", (0.62, 0.63, 0.66), rough=0.28, metal=1.0)
    # keep legends: emission-free keycap texture mixed on top of aluminium
    m = bpy.data.materials.new("laptop_frame"); m.use_nodes = True; nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(f"{PROPS}/laptop_frame.png")
    b.inputs["Metallic"].default_value = 0.9; b.inputs["Roughness"].default_value = 0.3
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    frame.data.materials.clear(); frame.data.materials.append(m)
    scr.data.materials.clear(); scr.data.materials.append(screen or screen_mat("lapscreen"))
    print("LAPUV", project_uv(scr, **LAP_UV))
    for o in objs:
        if o.type == "MESH":
            for p in o.data.polygons: p.use_smooth = True
    return root, frame, scr


def phone(loc, rot=(0, 0, 0), screen=None):
    root, objs = import_gltf(f"{PROPS}/phone.glb", name="phone")
    for o in list(objs):
        if o.name.startswith("Tunnel"):
            bpy.data.objects.remove(o, do_unlink=True); objs.remove(o)
    m = bpy.data.materials.new("phone_body"); m.use_nodes = True; nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(f"{PROPS}/phone_albedo_clean.png")
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"]); b.inputs["Metallic"].default_value = 0.6; b.inputs["Roughness"].default_value = 0.25
    scr = None
    for o in objs:
        if o.type != "MESH":
            continue
        if o.name.startswith("Screen"):
            o.data.materials.clear(); o.data.materials.append(screen or screen_mat("phonescreen")); scr = o
            print("PHUV", project_uv(o, **PH_UV))
        else:
            o.data.materials.clear(); o.data.materials.append(m)
    # phone lies on YZ plane, 3.99 tall: scale to 147 mm and lay it flat, screen up
    root.scale = (0.0368,) * 3
    holder = bpy.data.objects.new("phone_holder", None); bpy.context.scene.collection.objects.link(holder)
    root.parent = holder
    root.rotation_euler = (0, math.radians(-90), 0)
    root.location = (0, 0, 0)
    holder.location = loc; holder.rotation_euler = rot
    return holder, scr


def dev_room(with_bed=True):
    """Dev's room. Character sits at origin facing -Y. Desk top 0.788, front edge y=-0.28."""
    floor = plane("floor", (8, 8), (0, 0, 0), (0, 0, 0), mat_wood_floor("floorwood"))
    wall = mat_plaster("wallpaint", (0.36, 0.38, 0.42))
    plane("wall_back", (8, 3.2), (0, -1.28, 1.6), (math.radians(90), 0, 0), wall)
    plane("wall_left", (8, 3.2), (-1.6, 0, 1.6), (math.radians(90), 0, math.radians(90)), wall)
    plane("wall_right", (8, 3.2), (2.4, 0, 1.6), (math.radians(90), 0, math.radians(-90)), wall)
    plane("ceiling", (8, 8), (0, 0, 2.7), (math.radians(180), 0, 0), mat_simple("ceil", (0.5, 0.5, 0.5), 0.9))
    ph("metal_office_desk", loc=(0.35, -0.75, 0))
    ph("wooden_bookshelf_worn", loc=(1.75, -0.98, 0))
    ph("potted_plant_04", loc=(-0.45, -0.95, 0.788))
    ph("desk_lamp_arm_01", loc=(0.85, -0.95, 0.788), rot=math.radians(200))
    ph("alarm_clock_01", loc=(0.62, -0.82, 0.788), rot=math.radians(-15))
    if with_bed:
        ph("old_bed_frame", loc=(-0.95, 1.4, 0))
    office_chair((0.0, 0.07, 0), rot=0.0)
    return floor


def office_chair(loc, rot=0.0):
    ch, objs = import_gltf(f"{PROPS}/office_chair.gltf", name="chair")
    fab = mat_simple("chair_fabric", (0.035, 0.037, 0.04), rough=0.8)
    steel = mat_simple("chair_steel", (0.8, 0.8, 0.82), rough=0.2, metal=1.0)
    for o in objs:
        if o.type == "MESH":
            o.data.materials[0] = steel if o.data.materials and o.data.materials[0] and "steel" in o.data.materials[0].name else fab
    s = 1.05 / 2.166
    ch.scale = (s, s, s)
    bpy.context.view_layer.update()
    mn, mx = bbox(objs)
    ch.location = (loc[0] - (mn.x + mx.x) / 2, loc[1] - (mn.y + mx.y) / 2, -mn.z)
    ch.rotation_euler = (0, 0, rot)
    return ch


def room_lights(lamp_power=40, screen_fill=6, moon=25):
    # warm desk-lamp pool (spot from the lamp head)
    spot("lamp", (0.62, -0.78, 1.18), (0.1, -0.4, 0.78), lamp_power, angle=75, blend=0.8, color=(1.0, 0.72, 0.42), radius=0.04)
    # cool laptop spill on the face
    area("screenfill", (0.0, -0.62, 0.98), (0.0, -0.1, 1.22), screen_fill, size=0.3, color=(0.55, 0.7, 1.0))
    # moonlight from a window on the left wall
    area("moon", (-1.5, 0.3, 2.0), (0.0, -0.2, 0.9), moon, size=1.2, color=(0.45, 0.58, 1.0))
    # soft ambience
    world_hdri("night", 0.15)


def project_uv(o, flip_u=False, flip_v=False, swap=False):
    """Replace o's UVs by a planar projection over its two largest local axes (0..1)."""
    me = o.data
    co = [v.co for v in me.vertices]
    dims = [max(c[i] for c in co) - min(c[i] for c in co) for i in range(3)]
    ax = sorted(range(3), key=lambda i: -dims[i])[:2]
    a, b = ax if not swap else (ax[1], ax[0])
    mn = [min(c[i] for c in co) for i in range(3)]
    uvl = me.uv_layers.new(name="proj"); me.uv_layers.active = uvl
    for poly in me.polygons:
        for li in poly.loop_indices:
            c = co[me.loops[li].vertex_index]
            u = (c[a] - mn[a]) / dims[a]; v = (c[b] - mn[b]) / dims[b]
            uvl.data[li].uv = (1 - u if flip_u else u, 1 - v if flip_v else v)
    uvl.active_render = True
    return ax, dims
