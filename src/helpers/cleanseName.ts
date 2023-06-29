export default function (name: string) {
  return name.replace(/(^(S|U|S\+U)\s{1})|(\s\(Berlin\))/gi, '')
}
