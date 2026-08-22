import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([
    { id: 1, name: 'Cleanser', brand: 'CeraVe', cost: 8.99 },
    { id: 2, name: 'Toner', brand: 'Cosrx', cost: 6.50 },
    { id: 3, name: 'Serum', brand: 'The Ordinary', cost: 5.90 }
  ])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [cost, setCost] = useState('')

  const total = products.reduce((sum, p) => sum + p.cost, 0)

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a product name')
      return
    }
    const newProduct = { id: Date.now(), name, brand, cost: parseFloat(cost) || 0 }
    setProducts([...products, newProduct])
    setName('')
    setBrand('')
    setCost('')
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setProducts(products.filter(p => p.id !== id))
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>Products</Text>

        <TouchableOpacity style={styles.scannerBtn} onPress={() => navigation.navigate('BarcodeScanner')}>
          <Text style={styles.scannerBtnText}>📱 Scan Barcode</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? 'Cancel' : 'Add Product'}</Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Brand" value={brand} onChangeText={setBrand} />
            <TextInput style={styles.input} placeholder="Cost" value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}

        {products.map(p => (
          <View key={p.id} style={styles.card}>
            <View>
              <Text style={styles.pname}>{p.name}</Text>
              <Text style={styles.pbrand}>{p.brand}</Text>
              <Text style={styles.pcost}>€{p.cost.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(p.id)}>
              <Text style={styles.delete}>X</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.totals}>
          <Text style={styles.totaltext}>Total: €{total.toFixed(2)}</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F1F5' },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#14121A' },
  scannerBtn: { backgroundColor: '#B283AC', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  scannerBtnText: { color: 'white', fontWeight: 'bold' },
  addBtn: { padding: 12, borderRadius: 8, borderWidth: 2, borderColor: '#B283AC', marginBottom: 16 },
  addBtnText: { color: '#B283AC', textAlign: 'center', fontWeight: 'bold' },
  form: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ABA0AA', borderRadius: 8, padding: 12, marginBottom: 12 },
  saveBtn: { backgroundColor: '#B283AC', padding: 12, borderRadius: 8 },
  saveBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  pname: { fontWeight: 'bold', fontSize: 16, color: '#14121A' },
  pbrand: { color: '#9B97A0', fontSize: 12, marginTop: 4 },
  pcost: { color: '#B283AC', fontWeight: 'bold', marginTop: 4 },
  delete: { fontSize: 18, color: '#9B97A0' },
  totals: { backgroundColor: 'rgba(178, 131, 172, 0.1)', padding: 16, borderRadius: 12, marginBottom: 20 },
  totaltext: { fontWeight: 'bold', fontSize: 16, color: '#B283AC', textAlign: 'center' },
})