import sys, time, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from shots import SHOTS
from lib import render_settings
a = sys.argv[sys.argv.index("--") + 1:]
sid, mode = a[0], a[1]
fn, n = SHOTS[sid]
cam = fn(n)
sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, n
spp = int(os.environ.get("SPP", "8"))
render_settings(720, 1280, samples=spp)
sc.render.resolution_percentage = int(os.environ.get("PCT", "75"))
sc.cycles.max_bounces = 3; sc.cycles.diffuse_bounces = 1; sc.cycles.glossy_bounces = 1
sc.render.use_simplify = True; sc.render.simplify_subdivision_render = int(os.environ.get("SUBD", "0")); sc.cycles.texture_limit_render = "2048"
sc.cycles.use_light_tree = True
out = os.environ.get("FILM_OUT", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "build/shots")) + f"/{sid}"; os.makedirs(out, exist_ok=True)
t0 = time.time()
if mode == "still":
    for f in [int(x) for x in a[2].split(",")]:
        sc.frame_set(f); sc.render.filepath = f"{out}/still_{f:04d}"; bpy.ops.render.render(write_still=True)
    print("STILLS", sid, (time.time() - t0) / len(a[2].split(",")), "s/frame")
else:
    sc.render.use_overwrite = False; sc.render.use_placeholder = True
    sc.render.filepath = f"{out}/f_"; bpy.ops.render.render(animation=True)
    print("ANIM", sid, (time.time() - t0) / n, "s/frame")
if len(a) > 3 and a[3] == "save":
    bpy.ops.wm.save_as_mainfile(filepath=f"{out}/{sid}.blend")
