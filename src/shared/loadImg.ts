export function loadImg(src: string) {
	return new Promise((resolve, reject) => {
		let image = new Image();
		image.src = src;
		image.onload = () => resolve(image);
		image.onerror = reject;
	});
}