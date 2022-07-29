function getJSFunction(expression: string): (x: number) => number
{
	const code = `(x) => { return ${expression}; }`;

	return eval(code);
}

function trapezeArea(base1: number, base2: number, height: number)
{
	return (base1 + base2) / 2 * height;
}

function* integrate(expression: (x: number) => number, dx: number, minX: number, maxX: number): Generator<DOMPoint>
{
	let area = 0;

	for (let n = 0; n < Math.floor((maxX - minX) / dx); n++)
	{
		const x = minX + n * dx;
		const y1 = expression(x);
		const y2 = expression(x + dx);

		if (!isNaN(y1) && isFinite(y1) && !isNaN(y2) && isFinite(y2))
		{
			const areaUnderFunctionGraph = trapezeArea(y1, y2, dx);

			area += areaUnderFunctionGraph;

			yield new DOMPoint(x, -area);
		}		
	}
}

function applyMatrix(point: DOMPoint, matrix: DOMMatrix)
{
	return new DOMPoint(point.x * matrix.a + point.y * matrix.c + matrix.e, point.x * matrix.b + point.y * matrix.d + matrix.f);
}

function getPath2D(points: Generator<DOMPoint>, transform: DOMMatrix): Path2D
{
	const startPoint = points.next();
	const path = new Path2D();

	let pointExists = true;

	if (startPoint && !startPoint.done && startPoint.value instanceof DOMPoint)
	{
		const transformedStartPoint = applyMatrix(startPoint.value, transform);
		path.moveTo(transformedStartPoint.x, transformedStartPoint.y);

		for (; pointExists;)
		{
			const point = points.next();

			if (point && !point.done && point.value instanceof DOMPoint)
			{
				const transformedPoint = applyMatrix(point.value, transform);
				path.lineTo(transformedPoint.x, transformedPoint.y)
			}
			else
			{
				pointExists = false;
			}
		}
	}

	return path;
}

function draw(context: CanvasRenderingContext2D, path: Path2D, axisCenter: DOMPoint)
{
	context.clearRect(0, 0, 2560, 1440);

	context.strokeStyle = "black";
	context.beginPath()
	context.moveTo(axisCenter.x, axisCenter.y);
	context.lineTo(axisCenter.x, axisCenter.y - 1440);
	context.moveTo(axisCenter.x, axisCenter.y);
	context.lineTo(axisCenter.x + 2560, axisCenter.y);
	context.stroke();

	context.strokeStyle = "red";
	context.stroke(path);
}

function updateView(context: CanvasRenderingContext2D, expression: (x: number) => number, minX: number, maxX: number, transform: DOMMatrix)
{
	const dx = 1e-3;
	const path = getPath2D(integrate(expression, dx, minX, maxX), transform);

	draw(context, path, new DOMPoint(transform.e, transform.f));
}

window.onload = () =>
{
	const canvas = <HTMLCanvasElement>document.getElementById("cnvs");
	const context = canvas?.getContext("2d");
	const expression = <HTMLInputElement>document.getElementById("expression");
	const minX = <HTMLInputElement>document.getElementById("minX");
	const maxX = <HTMLInputElement>document.getElementById("maxX");
	const matrix = new DOMMatrix([100, 0, 0, 100, 100, 100]);

	if (canvas && context && expression && minX && maxX)
	{
		const update = () =>
		{
			try
			{
				updateView(context, getJSFunction(expression.value), parseFloat(minX.value), parseFloat(maxX.value), matrix);
			}
			catch (e)
			{
				console.log(e.message);
			}
		};

		let keyPressed = false;

		canvas.onmousedown = () => keyPressed = true;
		canvas.onmouseup = () => keyPressed = false;

		canvas.onmousemove = (event) =>
		{
			if (keyPressed)
			{
				matrix.e += event.movementX;
				matrix.f += event.movementY;

				update();
			}
		}

		expression.onchange = update;
		minX.onchange = update;
		maxX.onchange = update;
	}
}
