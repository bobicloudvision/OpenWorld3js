export function moveTowards(current: number, target: number, maxDelta: number): number {
	if (Math.abs(target - current) <= maxDelta) {
		return target;
	}
	return current + Math.sign(target - current) * maxDelta;
}

