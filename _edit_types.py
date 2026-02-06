# -*- coding: utf-8 -*-
from pathlib import Path
path = Path('src/pages/OperatorPage.tsx')
text = path.read_text()
old = 'type FanEmitters = {\\n  fan1?: FanEmitter;\\n  fan2?: FanEmitter;\\n};\\n\\n'
if old not in text:
    raise SystemExit('FanEmitters block not found')
text = text.replace(old, 'type FanEmitters = Record<string, FanEmitter | undefined>;\\n\\n', 1)
path.write_text(text)

