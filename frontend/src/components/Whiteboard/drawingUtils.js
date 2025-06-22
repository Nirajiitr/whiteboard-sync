

export const drawLine = (ctx, from, to, strokeColor, strokeWidth, eraser) => {
  ctx.save();
  ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = eraser ? strokeWidth * 2 : strokeWidth;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
};

export const drawShape = (ctx, start, end, shapeType, strokeColor, strokeWidth) => {
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();

  switch (shapeType) {
    case "circle":
      const radius = Math.hypot(end.x - start.x, end.y - start.y);
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      break;
    case "square":
      ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
      break;
    case "arrow":
      const headSize = 15;
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headSize * Math.cos(angle - Math.PI / 6),
        end.y - headSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headSize * Math.cos(angle + Math.PI / 6),
        end.y - headSize * Math.sin(angle + Math.PI / 6)
      );
      break;
  }

  ctx.stroke();
};
