
export function fitRange(value: number, min: number, max: number, targetMin: number, targetMax: number) {
    value = Math.max(min, Math.min(value, max))
    const percentage = (value - min) / (max - min)
    return targetMin + percentage * (targetMax - targetMin)
}