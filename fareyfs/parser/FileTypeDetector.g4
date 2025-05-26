grammar FileTypeDetector;

@header {
package com.fareyfs.parser;
}

// Parser Rules
fileType: (json | yaml | html | markdown | toml | xml | binary | text) EOF;

json: JSON_START jsonContent;
jsonContent: JSON_OBJECT | JSON_ARRAY;
JSON_OBJECT: '{' .*? '}';
JSON_ARRAY: '[' .*? ']';

yaml: YAML_START yamlContent;
yamlContent: YAML_DOCUMENT;
YAML_DOCUMENT: '---' .*? '...';

html: HTML_START htmlContent;
htmlContent: HTML_DOCUMENT;
HTML_DOCUMENT: '<!DOCTYPE' .*? '>' | '<html' .*? '</html>';

markdown: MARKDOWN_START markdownContent;
markdownContent: MARKDOWN_DOCUMENT;
MARKDOWN_DOCUMENT: '---' .*? '---';

toml: TOML_START tomlContent;
tomlContent: TOML_DOCUMENT;
TOML_DOCUMENT: '#' .*?;

xml: XML_START xmlContent;
xmlContent: XML_DOCUMENT;
XML_DOCUMENT: '<?xml' .*? '?>';

binary: BINARY_START;
BINARY_START: '\uFFD8\uFFE0' | '\u8950\u4E47' | '\u2550\u4446';

text: TEXT_CONTENT;
TEXT_CONTENT: ~[\uFFD8\uFFE0\u8950\u4E47\u2550\u4446{<#]+;

// Lexer Rules
JSON_START: '{' | '[';
YAML_START: '---';
HTML_START: '<!DOCTYPE' | '<html';
MARKDOWN_START: '---';
TOML_START: '#';
XML_START: '<?xml';
BINARY_START: '\uFFD8\uFFE0' | '\u8950\u4E47' | '\u2550\u4446';

WS: [ \t\r\n]+ -> skip; 