from test_ocr_simple import normalize_ingredient, capitalize_ingredient

candidates = [
    'lodised salt',
    'lodised salt.',
    'lodised  salt',
    'lodised Salt',
]
for s in candidates:
    n = normalize_ingredient(s)
    print(repr(s), '->', repr(n), '->', repr(capitalize_ingredient(n)))
