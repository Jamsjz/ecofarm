import time
from dataclasses import dataclass
from constants import SPEED


@dataclass
class Clock:
    start_real: float = time.monotonic()
    start_game: float = 0.0
    speed: float = SPEED  # 1.0 = real time, 2.0 = 2x faster, 0 = paused

    def now(self) -> float:
        return self.start_game + (time.monotonic() - self.start_real) * self.speed
