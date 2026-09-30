"""The shot list as code. Each shot builds only what its camera needs, then renders shot-local frames 1..N."""
import bpy, math, random
from mathutils import Vector
from lib import *
from sets import *

import os
SCR = os.environ.get("FILM_SCR", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "build/screens"))
DEV = "Male_Adult_20"
CLIENT = "Business_Male_04"
HEAD = (0.0, -0.10, 1.235)          # dev head (sit_table idle)
LAP = (0.0, -0.47, 0.788)           # laptop base
LAPSCR = (0.0, -0.585, 0.93)        # laptop screen centre (approx)
PHONE = (0.30, -0.44, 0.789)


# ------------------------------------------------------------------ helpers
def seq_mat(name, kind, start=1, rect=None, strength=2.2, hold=None):
    import os
    d = f"{SCR}/{kind}"; files = sorted(f for f in os.listdir(d) if f.endswith(".jpeg")); n = len(files)
    if hold is not None:
        return screen_mat(name, f"{d}/{files[min(hold, n - 1)]}", strength=strength, uv_rect=rect)
    m = screen_mat(name, f"{d}/{files[0]}", strength=strength, seq_frames=n, seq_start=start, uv_rect=rect)
    t = m.node_tree.nodes[m["tex"]]
    t.image_user.frame_offset = -1
    return m


LAP_RECT = (0.025, 0.975, 0.035, 0.94)


def blinks(mesh, n, seed=1, every=(60, 100)):
    random.seed(seed); f = random.randint(8, 30)
    while f < n:
        for k in ("AK_09_EyeBlinkLeft", "AK_10_EyeBlinkRight"):
            shape(mesh, k, [(f - 2, 0), (f, 1), (f + 2, 1), (f + 5, 0)])
        f += random.randint(*every)


def expr(mesh, keys, frames_vals):
    for k in keys:
        shape(mesh, k, frames_vals)


def handheld(cam, strength=0.004, scale=40):
    cam.animation_data_create()
    for fc in (cam.animation_data.action.layers[0].strips[0].channelbags[0].fcurves if cam.animation_data.action else []):
        if fc.data_path == "rotation_euler":
            m = fc.modifiers.new("NOISE"); m.strength = strength; m.scale = scale; m.phase = random.random() * 100


def cam_move(cam, n, p0, t0, p1, t1, lens0, lens1=None, fstop=2.0, focus=None, ease=True):
    key_cam(cam, 1, p0, t0, lens=lens0)
    key_cam(cam, n, p1, t1, lens=lens1 or lens0)
    cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = fstop
    if focus is not None:
        if isinstance(focus, str):
            cam.data.dof.focus_object = bpy.data.objects[focus]
        else:
            e = bpy.data.objects.new("focus", None); bpy.context.scene.collection.objects.link(e); e.location = focus
            cam.data.dof.focus_object = e
    if cam.animation_data and cam.animation_data.action:
        for cb in cam.animation_data.action.layers[0].strips[0].channelbags:
            for fc in cb.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "BEZIER"
                    kp.easing = "AUTO"
    for cb in (cam.data.animation_data.action.layers[0].strips[0].channelbags if cam.data.animation_data and cam.data.animation_data.action else []):
        for fc in cb.fcurves:
            for kp in fc.keyframe_points: kp.interpolation = "BEZIER"


def eyes(arm, f):
    sc = bpy.context.scene; cur = sc.frame_current; sc.frame_set(f); bpy.context.view_layer.update()
    mw = arm.matrix_world
    p = (mw @ arm.pose.bones["Bip01 REye"].head + mw @ arm.pose.bones["Bip01 LEye"].head) / 2
    sc.frame_set(cur); return p


def face_cam(arm, n, off0, off1, lens0, lens1=None, fstop=2.0, aim=(0, 0, -0.02)):
    """Camera placed relative to the eyes (tracked at first/last frame); focus follows the eyes."""
    e0 = eyes(arm, 1); e1 = eyes(arm, n)
    cam = camera()
    t0 = e0 + Vector(aim); t1 = e1 + Vector(aim)
    cam_move(cam, n, tuple(e0 + Vector(off0)), tuple(t0), tuple(e1 + Vector(off1)), tuple(t1), lens0, lens1, fstop=fstop)
    foc = bpy.data.objects.new("eyefocus", None); bpy.context.scene.collection.objects.link(foc)
    foc.parent = arm; foc.parent_type = "BONE"; foc.parent_bone = "Bip01 LEye"
    cam.data.dof.focus_object = foc
    return cam


def head_target(name="head_t", loc=HEAD):
    e = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(e); e.location = loc; return e


# ------------------------------------------------------------------ sets
def night_city(y=-45.0, x0=-70.0, x1=80.0, lit_frac=0.22, tower_col=(0.006, 0.007, 0.011), emit=5):
    """Distant city skyline behind the window: dark towers with lit windows, far enough for real parallax and bokeh."""
    random.seed(7)
    tower = mat_simple("tower", tower_col, rough=0.9)
    lit = mat_simple("winlit", (0, 0, 0), emit=(1.0, 0.70, 0.40), emit_strength=emit)
    lit2 = mat_simple("winlit2", (0, 0, 0), emit=(0.65, 0.78, 1.0), emit_strength=3.5)
    red = mat_simple("beacon", (0, 0, 0), emit=(1.0, 0.1, 0.05), emit_strength=20)
    x = x0
    while x < x1:
        w = random.uniform(8, 18); h = random.uniform(18, 70); d = y - random.uniform(0, 30)
        plane("tw", (w, h), (x + w / 2, d, h / 2), (math.radians(90), 0, 0), tower)
        cols, rows = int(w / 1.6), int(h / 2.0)
        for i in range(cols):
            for j in range(rows):
                if random.random() < lit_frac:
                    plane("wl", (0.9, 1.2), (x + 0.9 + i * 1.6, d + 0.05, 1.5 + j * 2.0), (math.radians(90), 0, 0), lit if random.random() < 0.7 else lit2)
        if random.random() < 0.3:
            plane("bc", (0.5, 0.5), (x + w / 2, d + 0.05, h + 0.4), (math.radians(90), 0, 0), red)
        x += w + random.uniform(1, 6)


def dev_set(character=True, city=True, clip=None, n=100, typing=True):
    sc = reset()
    floor = plane("floor", (8, 8), (0, 0, 0), (0, 0, 0), mat_wood_floor("floorwood"))
    wall = mat_plaster("wallpaint", (0.30, 0.32, 0.36))
    # back wall with a window (x -0.55..1.05, z 0.95..2.15)
    wx0, wx1, wz0, wz1, wy = -0.55, 1.05, 0.95, 2.15, -1.28
    plane("wb_l", (2.2, 3.2), (wx0 - 1.1, wy, 1.6), (math.radians(90), 0, 0), wall)
    plane("wb_r", (2.2, 3.2), (wx1 + 1.1, wy, 1.6), (math.radians(90), 0, 0), wall)
    plane("wb_b", (wx1 - wx0, wz0), (0.25, wy, wz0 / 2), (math.radians(90), 0, 0), wall)
    plane("wb_t", (wx1 - wx0, 3.2 - wz1), (0.25, wy, (3.2 + wz1) / 2), (math.radians(90), 0, 0), wall)
    frame_m = mat_simple("winframe", (0.02, 0.02, 0.022), rough=0.4)
    for (sx, sz, lx, lz) in [(wx1 - wx0 + 0.08, 0.05, 0.25, wz0), (wx1 - wx0 + 0.08, 0.05, 0.25, wz1), (0.05, wz1 - wz0, wx0, (wz0 + wz1) / 2), (0.05, wz1 - wz0, wx1, (wz0 + wz1) / 2), (0.03, wz1 - wz0, 0.25, (wz0 + wz1) / 2)]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(lx, wy + 0.02, lz)); o = bpy.context.active_object; o.scale = (sx, 0.06, sz); o.data.materials.append(frame_m)
    plane("wall_left", (8, 3.2), (-1.6, 0, 1.6), (math.radians(90), 0, math.radians(90)), wall)
    plane("wall_right", (8, 3.2), (2.4, 0, 1.6), (math.radians(90), 0, math.radians(-90)), wall)
    plane("wall_front", (8, 3.2), (0, 3.0, 1.6), (math.radians(90), 0, 0), wall)
    plane("ceiling", (8, 8), (0, 0, 3.2), (math.radians(180), 0, 0), mat_simple("ceil", (0.4, 0.4, 0.42), 0.9))
    if city:
        night_city()
    ph("metal_office_desk", loc=(0.35, -0.75, 0))
    ph("wooden_bookshelf_worn", loc=(1.9, -0.98, 0))
    ph("potted_plant_04", loc=(-0.45, -1.0, 0.788))
    ph("desk_lamp_arm_01", loc=(0.85, -0.95, 0.788), rot=math.radians(200))
    ph("alarm_clock_01", loc=(0.62, -0.86, 0.788), rot=math.radians(-15))
    ph("old_bed_frame", loc=(-0.95, 1.6, 0))
    ph("drawer_cabinet", loc=(-1.25, -0.6, 0), rot=math.radians(90))
    office_chair((0.0, 0.07, 0))
    arm = mesh = None
    if character:
        arm, mesh, root = load_character(DEV)
        drive(arm, root, clip or [("m_sit_table_idle_neutral_01", 1, 1, 1 + n, 0)])
        if typing:
            type_fingers(arm, n)
        blinks(mesh, n)
    return sc, arm, mesh


def _two_bone(S, E, W, T, pole):
    """Return new elbow & wrist positions for shoulder S reaching T, bending toward pole."""
    a = (E - S).length; b = (W - E).length
    d = min((T - S).length, (a + b) * 0.999); dirv = (T - S).normalized()
    x = (a * a - b * b + d * d) / (2 * d); h = math.sqrt(max(a * a - x * x, 0))
    pv = (pole - S); pv = (pv - dirv * pv.dot(dirv)).normalized()
    E2 = S + dirv * x + pv * h
    W2 = S + dirv * d
    return E2, W2


def _rot_bone_to(arm, pb, old_vec, new_vec):
    """Rotate pose bone (armature space) so that world vector old_vec maps to new_vec, about its head."""
    mw = arm.matrix_world; inv = mw.inverted()
    ov = (inv.to_3x3() @ old_vec).normalized(); nv = (inv.to_3x3() @ new_vec).normalized()
    q = ov.rotation_difference(nv)
    M = pb.matrix.copy(); head = M.translation.copy()
    R = q.to_matrix().to_4x4() @ M
    R.translation = head
    pb.matrix = R


def _align_hand(arm, side, hd, fwd_t, lat_t):
    mw = arm.matrix_world; inv = mw.inverted()
    P = lambda nm: mw @ arm.pose.bones[f"Bip01 {side} {nm}"].head
    W = mw @ hd.head
    fwd = (P("Finger2") - W).normalized(); lat = (P("Finger1") - P("Finger3")).normalized()
    def basis(f, l):
        f = f.normalized(); up = f.cross(l).normalized(); l2 = up.cross(f).normalized()
        from mathutils import Matrix
        return Matrix((f, l2, up)).transposed()
    R = basis(fwd_t, lat_t) @ basis(fwd, lat).inverted()
    Ra = inv.to_3x3() @ R @ mw.to_3x3()
    Ra = (inv.to_3x3().normalized() @ R @ mw.to_3x3().normalized())
    M = hd.matrix.copy(); head = M.translation.copy()
    N = Ra.to_4x4() @ M; N.translation = head
    hd.matrix = N


def type_fingers(arm, n, seed=3, kb=(0.0, -0.44, 0.83)):
    """Bake hands onto the keyboard with an analytic 2-bone IK per frame, then finger taps."""
    random.seed(seed)
    sc = bpy.context.scene
    arm_bones = {}
    for side in ("L", "R"):
        ua = arm.pose.bones[f"Bip01 {side} UpperArm"]; fa = arm.pose.bones[f"Bip01 {side} Forearm"]; hd = arm.pose.bones[f"Bip01 {side} Hand"]
        arm_bones[side] = (ua, fa, hd)
    # drop mocap on the arm chain (spine/clavicle keep theirs)
    for side, (ua, fa, hd) in arm_bones.items():
        for pb in [ua, fa, hd] + [c for c in fa.children if "Twist" in c.name] + [c for c in ua.children if "Twist" in c.name]:
            for c in list(pb.constraints):
                pb.constraints.remove(c)
            pb.rotation_mode = "QUATERNION"
    mw = arm.matrix_world
    for f in range(1, n + 1, 2):
        sc.frame_set(f)
        for side, (ua, fa, hd) in arm_bones.items():
            dx = 0.105 if side == "L" else -0.105
            T = Vector((kb[0] + dx + 0.010 * math.sin(f * 0.23 + (0 if side == "L" else 1.7)), kb[1] + 0.008 * math.sin(f * 0.31 + dx * 30), kb[2] + 0.005 * abs(math.sin(f * 0.8 + dx * 20))))
            for pb in (ua, fa, hd):
                pb.rotation_quaternion = (1, 0, 0, 0)
            bpy.context.view_layer.update()
            S = mw @ ua.head; E = mw @ fa.head; W = mw @ hd.head
            pole = S + Vector((dx * 5, 0.25, -0.45))
            E2, W2 = _two_bone(S, E, W, T, pole)
            _rot_bone_to(arm, ua, E - S, E2 - S); bpy.context.view_layer.update()
            E = mw @ fa.head; W = mw @ hd.head
            _rot_bone_to(arm, fa, W - E, W2 - E); bpy.context.view_layer.update()
            # palm down, fingers forward (-Y): align (forward, lateral) frame of the hand
            _align_hand(arm, side, hd, Vector((-dx * 0.6, -1.0, -0.3)), Vector((-1.0 if side == "L" else 1.0, 0.0, 0.1)))
            for pb in (ua, fa, hd):
                pb.keyframe_insert("rotation_quaternion", frame=f)
    for side in ("L", "R"):
        for fi in ("Finger1", "Finger2", "Finger3", "Finger4"):
            for seg in ("", "1", "2"):
                pb = arm.pose.bones.get(f"Bip01 {side} {fi}{seg}")
                if not pb:
                    continue
                for c in list(pb.constraints):
                    pb.constraints.remove(c)
                pb.rotation_mode = "XYZ"
                base = math.radians(20 if seg else 14)
                f = random.randint(1, 6)
                while f < n:
                    tap = math.radians(random.uniform(10, 20)) if (seg == "" and fi in ("Finger1", "Finger2", "Finger3")) else 0.0
                    for ff, v in ((f, base), (f + 2, base + tap), (f + 4, base)):
                        pb.rotation_euler = (0, 0, v); pb.keyframe_insert("rotation_euler", frame=ff)
                    f += random.randint(5, 11)


def dev_props(lap_screen=None, phone_screen=None):
    lr, lf, ls = laptop(LAP, rot=math.radians(180), screen=lap_screen)
    hh, ps = phone(PHONE, rot=(0, 0, math.radians(-96)), screen=phone_screen)
    return lr, hh


def dev_lights(lamp=38, screen=5.0, moon=10, screen_col=(0.55, 0.7, 1.0)):
    spot("lamp", (0.66, -0.80, 1.20), (0.15, -0.42, 0.78), lamp * 1.6, angle=80, blend=0.85, color=(1.0, 0.70, 0.40), radius=0.035)
    point("lampbulb", (0.66, -0.80, 1.22), 3, color=(1.0, 0.7, 0.4), radius=0.02)
    area("kicker", (0.9, -0.6, 1.6), (0.0, -0.1, 1.3), 14, size=0.4, color=(1.0, 0.72, 0.45))
    area("screenfill", (0.0, -0.60, 0.97), (0.0, -0.1, 1.22), screen, size=0.28, color=screen_col)
    area("moon", (0.25, -1.9, 1.7), (0.0, -0.2, 1.0), moon, size=1.4, color=(0.42, 0.55, 1.0))
    area("bounce", (-1.2, 1.5, 2.2), (0.0, -0.4, 0.8), 6, size=2.0, color=(0.5, 0.55, 0.7))
    world_hdri("night", 0.35, rot=math.radians(180))
    bpy.context.scene.view_settings.exposure = 0.6


def office_set(character=True, clip=None, n=100):
    sc = reset()
    plane("floor", (10, 10), (0, 0, 0), (0, 0, 0), mat_simple("carpet", (0.09, 0.085, 0.08), rough=0.95))
    wall = mat_plaster("offwall", (0.55, 0.52, 0.48))
    # glass wall behind the desk: dusk skyline
    plane("wall_left", (10, 3.2), (-2.2, 0, 1.6), (math.radians(90), 0, math.radians(90)), wall)
    plane("wall_right", (10, 3.2), (2.6, 0, 1.6), (math.radians(90), 0, math.radians(-90)), wall)
    plane("wall_front", (10, 3.2), (0, 3.2, 1.6), (math.radians(90), 0, 0), wall)
    plane("ceiling", (10, 10), (0, 0, 3.0), (math.radians(180), 0, 0), mat_simple("ceil", (0.6, 0.6, 0.6), 0.9))
    frame_m = mat_simple("mullion", (0.05, 0.05, 0.055), rough=0.3, metal=0.8)
    for x in (-2.0, -0.9, 0.2, 1.3, 2.4):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -1.6, 1.5)); o = bpy.context.active_object; o.scale = (0.06, 0.06, 3.0); o.data.materials.append(frame_m)
    world_sky(3.0, 180.0, 0.5)
    night_city(y=-60.0, x0=-90, x1=90, lit_frac=0.12, tower_col=(0.03, 0.03, 0.04), emit=3)
    ph("wooden_bookshelf_worn", loc=(-1.6, -1.0, 0), rot=math.radians(90))
    ph("drawer_cabinet", loc=(1.9, 0.4, 0), rot=math.radians(-90))
    office_chair((0.9, 0.9, 0), rot=math.radians(150))
    # standing desk: Poly Haven desk raised to 1.05 m
    r, objs = ph("metal_office_desk", loc=(0.0, -0.72, 0)); r.scale = (0.8, 0.9, 1.33)
    ph("potted_plant_04", loc=(1.9, -1.2, 0), scale=2.6)
    ph("vintage_cabinet_01", loc=(-1.9, 0.6, 0), rot=math.radians(90))
    arm = mesh = None
    if character:
        arm, mesh, root = load_character(CLIENT)
        drive(arm, root, clip or [("m_work_table", 1, 1, 1 + n, 0)])
        blinks(mesh, n, seed=5)
    return sc, arm, mesh


def office_lights(key=60):
    area("sunset", (0.5, -3.0, 2.2), (0.0, 0.0, 1.3), key, size=3.0, color=(1.0, 0.62, 0.35))
    area("ceilfill", (0.3, 0.8, 2.9), (0.0, 0.0, 1.0), 25, size=1.5, color=(0.9, 0.95, 1.0))
    area("rim", (-1.2, -1.4, 2.0), (0.0, 0.0, 1.5), 30, size=0.6, color=(1.0, 0.75, 0.5))


def attach_phone_to_hand(arm, screen=None, side="R", off=(0.0, 0.0, 0.0), rot=(0, 0, 0)):
    hh, ps = phone((0, 0, 0), screen=screen)
    hh.parent = arm; hh.parent_type = "BONE"; hh.parent_bone = f"Bip01 {side} Hand"
    hh.location = off; hh.rotation_euler = rot
    return hh


# ------------------------------------------------------------------ the shots
def S01(n):
    sc, arm, mesh = dev_set(n=n)
    dev_props(seq_mat("lap", "editor"), screen_mat("ph_off"))
    dev_lights()
    cam = camera()
    cam_move(cam, n, (1.05, 1.45, 1.52), (0.1, -0.5, 1.02), (0.78, 0.95, 1.42), (0.1, -0.5, 1.02), 24, 26, fstop=2.0, focus=(0.0, -0.2, 1.1))
    return cam


def S02(n):
    sc, arm, mesh = dev_set(n=n, city=True)
    dev_props(seq_mat("lap", "send", rect=LAP_RECT), screen_mat("ph_off"))
    dev_lights()
    cam = camera()
    cam_move(cam, n, (0.34, 0.02, 1.42), LAPSCR, (0.24, -0.16, 1.30), LAPSCR, 45, 55, fstop=2.2, focus=LAPSCR)
    return cam


def S03(n):
    sc, arm, mesh = dev_set(n=n, clip=[("m_sit_table_breathe_01", 1, 1, 1 + n, 0)], typing=False)
    dev_props(seq_mat("lap", "send", rect=LAP_RECT, hold=83), screen_mat("ph_off"))
    dev_lights()
    expr(mesh, ["AK_44_MouthSmileLeft", "AK_45_MouthSmileRight"], [(1, 0.0), (18, 0.0), (34, 0.55), (n, 0.5)])
    expr(mesh, ["AK_06_CheekPuff"], [(1, 0), (n, 0)])
    expr(mesh, ["AK_19_EyeSquintLeft", "AK_20_EyeSquintRight"], [(18, 0), (34, 0.35), (n, 0.3)])
    return face_cam(arm, n, (-0.42, -0.88, 0.02), (-0.36, -0.80, 0.01), 65, 70)


def S04(n):
    sc, arm, mesh = dev_set(character=False, n=n, city=False)
    lr, hh = dev_props(seq_mat("lap", "send", rect=LAP_RECT, hold=83), seq_mat("ph", "lock1", strength=1.6))
    # buzz: tiny jitter on the phone
    for f in range(1, n + 1):
        on = (12 <= f <= 26) or (36 <= f <= 48)
        hh.location = (PHONE[0] + (0.0012 * math.sin(f * 3.1) if on else 0), PHONE[1] + (0.0008 * math.cos(f * 4.3) if on else 0), PHONE[2])
        hh.keyframe_insert("location", frame=f)
    dev_lights()
    cam = camera()
    c = Vector(PHONE) + Vector((0.0, 0.0, 0.0))
    cam_move(cam, n, (c.x + 0.015, c.y + 0.06, c.z + 0.30), (c.x, c.y - 0.005, c.z), (c.x + 0.01, c.y + 0.045, c.z + 0.25), (c.x, c.y - 0.005, c.z), 55, 58, fstop=4.0, focus=tuple(c))
    return cam


def S05(n):
    sc, arm, mesh = dev_set(n=n, clip=[("m_sit_table_idle_nervous_01", 1, 60, 60 + n, 0)], typing=False)
    dev_props(seq_mat("lap", "editor", hold=90), screen_mat("ph_off"))
    dev_lights(lamp=22, screen=6.5)
    expr(mesh, ["AK_44_MouthSmileLeft", "AK_45_MouthSmileRight"], [(1, 0.35), (30, 0.0)])
    expr(mesh, ["AK_30_MouthFrownLeft", "AK_31_MouthFrownRight"], [(20, 0), (60, 0.55), (n, 0.6)])
    expr(mesh, ["AK_01_BrowDownLeft", "AK_02_BrowDownRight"], [(30, 0), (70, 0.5), (n, 0.55)])
    expr(mesh, ["AK_03_BrowInnerUp"], [(20, 0), (50, 0.45), (n, 0.35)])
    expr(mesh, ["AK_11_EyeLookDownLeft", "AK_12_EyeLookDownRight"], [(40, 0), (70, 0.35), (n, 0.4)])
    return face_cam(arm, n, (-0.22, -0.62, 0.03), (-0.17, -0.50, 0.02), 85, 85, fstop=1.8)


def S06(n):
    sc, arm, mesh = dev_set(character=False, n=n, city=False)
    dev_props(seq_mat("lap", "editor", hold=90), seq_mat("ph", "chat", strength=1.6))
    dev_lights()
    cam = camera()
    c = Vector(PHONE)
    cam_move(cam, n, (c.x - 0.04, c.y + 0.08, c.z + 0.26), (c.x, c.y - 0.005, c.z), (c.x - 0.03, c.y + 0.06, c.z + 0.22), (c.x, c.y - 0.005, c.z), 55, 58, fstop=4.0, focus=tuple(c))
    return cam


def S07(n):
    sc, arm, mesh = dev_set(n=n, clip=[("m_sit_table_idle_scratch_head", 1, 1, 1 + n, 0)], typing=False)
    dev_props(seq_mat("lap", "site", hold=1), screen_mat("ph_off"))
    dev_lights(lamp=25)
    expr(mesh, ["AK_01_BrowDownLeft", "AK_02_BrowDownRight"], [(1, 0.5), (n, 0.3)])
    cam = camera()
    cam_move(cam, n, (1.05, -0.30, 1.12), (0.0, -0.28, 1.05), (0.95, -0.30, 1.12), (0.0, -0.28, 1.05), 35, 38, fstop=2.4, focus=(0.0, -0.15, 1.15))
    return cam


def S08(n):
    sc, arm, mesh = dev_set(n=n, typing=True)
    dev_props(seq_mat("lap", "site", rect=LAP_RECT), screen_mat("ph_off"))
    dev_lights(screen_col=(1.0, 0.72, 0.42))
    cam = camera()
    cam_move(cam, n, (0.05, -0.16, 1.30), LAPSCR, (0.02, -0.30, 1.16), LAPSCR, 45, 50, fstop=2.8, focus=LAPSCR)
    return cam


def S09(n):
    sc, arm, mesh = dev_set(n=n, typing=True)
    dev_props(seq_mat("lap", "term", rect=LAP_RECT), screen_mat("ph_off"))
    dev_lights(screen_col=(1.0, 0.75, 0.5))
    cam = camera()
    cam_move(cam, n, (-0.26, -0.06, 1.34), LAPSCR, (-0.17, -0.20, 1.22), LAPSCR, 45, 52, fstop=2.2, focus=LAPSCR)
    return cam


def S10(n):
    sc, arm, mesh = dev_set(n=n, typing=True)
    dev_props(seq_mat("lap", "term", rect=LAP_RECT, hold=107), screen_mat("ph_off"))
    dev_lights(screen_col=(1.0, 0.75, 0.5), screen=7)
    expr(mesh, ["AK_44_MouthSmileLeft"], [(1, 0.0), (30, 0.45), (n, 0.5)])
    expr(mesh, ["AK_45_MouthSmileRight"], [(1, 0.0), (30, 0.25), (n, 0.3)])
    expr(mesh, ["AK_19_EyeSquintLeft", "AK_20_EyeSquintRight"], [(1, 0.1), (n, 0.3)])
    return face_cam(arm, n, (0.30, -0.80, -0.26), (0.26, -0.72, -0.24), 50, 55, aim=(0, 0, -0.06))


def S11(n):
    sc, arm, mesh = office_set(n=n, clip=[("m_cell_phone_textmessage", 1, 30, 30 + n, 0)])
    root = bpy.data.objects[CLIENT + "_root"]; root.location = (0.9, -1.0, 0); root.rotation_euler = (0, 0, math.radians(200))
    attach_phone_to_hand(arm, screen_mat("cph", None, strength=1.0), off=(0.0, 0.02, 0.0), rot=(0, 0, 0))
    expr(mesh, ["AK_44_MouthSmileLeft"], [(1, 0.0), (40, 0.55), (n, 0.6)])
    expr(mesh, ["AK_19_EyeSquintLeft", "AK_20_EyeSquintRight"], [(30, 0.0), (50, 0.3)])
    office_lights()
    cam = camera()
    cam_move(cam, n, (0.05, 0.05, 1.62), (0.9, -1.0, 1.45), (0.15, -0.12, 1.6), (0.9, -1.0, 1.5), 38, 42, fstop=2.0, focus=(0.9, -1.0, 1.5))
    return cam


def S12(n):
    sc, arm, mesh = dev_set(character=False, n=n, city=False)
    dev_props(seq_mat("lap", "term", rect=LAP_RECT, hold=107), seq_mat("ph", "lock2", strength=1.6))
    dev_lights()
    cam = camera()
    c = Vector(PHONE)
    cam_move(cam, n, (c.x + 0.08, c.y + 0.07, c.z + 0.25), (c.x, c.y - 0.005, c.z), (c.x + 0.06, c.y + 0.05, c.z + 0.21), (c.x, c.y - 0.005, c.z), 55, 58, fstop=4.0, focus=tuple(c))
    return cam


def S13(n):
    sc, arm, mesh = dev_set(n=n, typing=False)
    dev_props(seq_mat("lap", "kill", rect=LAP_RECT), screen_mat("ph_off"))
    dev_lights(screen_col=(1.0, 0.72, 0.42))
    cam = camera()
    cam_move(cam, n, (0.22, -0.10, 1.30), LAPSCR, (0.14, -0.24, 1.18), LAPSCR, 45, 52, fstop=2.2, focus=LAPSCR)
    return cam


def S14(n):
    sc, arm, mesh = office_set(n=n, clip=[("m_work_table", 1, 20, 20 + n, 0)])
    lr, lf, ls = laptop((0.0, -0.46, 1.048), rot=math.radians(180), screen=seq_mat("clap", "portal", rect=LAP_RECT))
    office_lights()
    s = Vector((0.0, -0.575, 1.19))
    cam = camera()
    cam_move(cam, n, (0.30, 0.02, 1.62), tuple(s), (0.22, -0.14, 1.52), tuple(s), 45, 52, fstop=2.4, focus=tuple(s))
    return cam


def S15(n):
    sc, arm, mesh = office_set(n=n, clip=[("m_idle_angry_01", 1, 1, 1 + n, 0)])
    lr, lf, ls = laptop((0.0, -0.46, 1.048), rot=math.radians(180), screen=seq_mat("clap", "portal", rect=LAP_RECT, hold=71))
    expr(mesh, ["AK_01_BrowDownLeft", "AK_02_BrowDownRight"], [(1, 0.3), (12, 1.0), (n, 1.0)])
    expr(mesh, ["AU_04_BrowLowerer"], [(1, 0.2), (12, 1.0), (n, 1.0)])
    expr(mesh, ["AK_50_NoseSneerLeft", "AK_51_NoseSneerRight"], [(1, 0), (14, 0.8), (n, 0.7)])
    expr(mesh, ["AK_30_MouthFrownLeft", "AK_31_MouthFrownRight"], [(1, 0), (14, 0.8), (n, 0.8)])
    expr(mesh, ["AK_19_EyeSquintLeft", "AK_20_EyeSquintRight"], [(10, 0), (18, 0.5)])
    expr(mesh, ["AK_21_EyeWideLeft", "AK_22_EyeWideRight"], [(1, 0.6), (10, 0.2)])
    expr(mesh, ["AK_25_JawOpen"], [(1, 0.25), (8, 0.35), (18, 0.05)])
    expr(mesh, ["AK_36_MouthPressLeft", "AK_37_MouthPressRight"], [(12, 0), (22, 0.7)])
    office_lights()
    return face_cam(arm, n, (-0.40, -0.95, -0.02), (-0.34, -0.84, -0.02), 65, 70)


def S16(n):
    sc, arm, mesh = dev_set(character=False, n=n, city=False)
    dev_props(seq_mat("lap", "kill", rect=LAP_RECT, hold=83), seq_mat("ph", "lock3", strength=1.6))
    dev_lights()
    cam = camera()
    c = Vector(PHONE)
    cam_move(cam, n, (c.x + 0.015, c.y + 0.06, c.z + 0.29), (c.x, c.y - 0.005, c.z), (c.x + 0.01, c.y + 0.04, c.z + 0.23), (c.x, c.y - 0.005, c.z), 55, 60, fstop=4.0, focus=tuple(c))
    return cam


def S17(n):
    sc, arm, mesh = dev_set(n=n, clip=[("m_sit_table_idle_relaxed_01", 1, 120, 120 + n, 0)], typing=False)
    dev_props(seq_mat("lap", "restore", rect=LAP_RECT), screen_mat("ph_off"))
    dev_lights(screen_col=(0.6, 1.0, 0.7))
    expr(mesh, ["AK_44_MouthSmileLeft", "AK_45_MouthSmileRight"], [(1, 0.1), (20, 0.7), (n, 0.7)])
    expr(mesh, ["AK_19_EyeSquintLeft", "AK_20_EyeSquintRight"], [(1, 0.1), (20, 0.4)])
    return face_cam(arm, n, (-0.36, -0.80, 0.02), (-0.32, -0.74, 0.02), 70, 75)


def S18(n):
    sc, arm, mesh = dev_set(n=n)
    dev_props(seq_mat("lap", "editor"), screen_mat("ph_off"))
    dev_lights()
    cam = camera()
    cam_move(cam, n, (0.9, 1.0, 1.35), (0.05, -0.55, 1.0), (1.35, 1.9, 1.55), (0.05, -0.55, 1.0), 30, 28, fstop=3.0, focus=(0.0, -0.3, 1.05))
    return cam


SHOTS = {  # id: (builder, frames)
    "S01": (S01, 108), "S02": (S02, 84), "S03": (S03, 72), "S04": (S04, 84), "S05": (S05, 96), "S06": (S06, 72),
    "S07": (S07, 84), "S08": (S08, 108), "S09": (S09, 108), "S10": (S10, 72), "S11": (S11, 84), "S12": (S12, 60),
    "S13": (S13, 84), "S14": (S14, 72), "S15": (S15, 60), "S16": (S16, 72), "S17": (S17, 48), "S18": (S18, 72),
}
