export function validateBody(schema) {
    return (request, response, next) => {
        const parsed = schema.safeParse(request.body);
        if (!parsed.success)
            return response.status(400).json({ error: 'Datos inválidos.', details: parsed.error.flatten().fieldErrors });
        request.body = parsed.data;
        next();
    };
}
