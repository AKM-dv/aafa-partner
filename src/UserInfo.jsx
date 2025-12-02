import { useState, useMemo } from 'react'
import './UserInfo.css'

const statesAndCities = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole', 'Nandyal', 'Machilipatnam', 'Adoni', 'Tenali', 'Chittoor', 'Hindupur', 'Proddatur', 'Bhimavaram', 'Madanapalle', 'Guntakal', 'Dharmavaram', 'Gudivada', 'Narasaraopet', 'Tadipatri', 'Tadepalligudem', 'Chilakaluripet', 'Srikakulam', 'Bapatla'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Daporijo', 'Tezu', 'Roing', 'Bomdila', 'Khonsa', 'Aalo', 'Namsai', 'Changlang', 'Seppa', 'Yingkiong', 'Longding', 'Namsang'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Sivasagar', 'Barpeta', 'Diphu', 'Karimganj', 'Goalpara', 'Bongaigaon', 'Dhubri', 'Hailakandi', 'Lakhimpur', 'Mangaldoi', 'Morigaon', 'Nalbari', 'North Lakhimpur', 'Sibsagar', 'Titabor', 'Dhekiajuli', 'Biswanath Chariali', 'Sualkuchi'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chapra', 'Sasaram', 'Hajipur', 'Dehri', 'Bettiah', 'Motihari', 'Sitamarhi', 'Madhubani', 'Samastipur', 'Saharsa', 'Supaul', 'Kishanganj', 'Jamalpur', 'Buxar', 'Aurangabad', 'Jehanabad', 'Nawada', 'Gopalganj', 'Siwan', 'Bhojpur'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajpur', 'Raigarh', 'Jagdalpur', 'Ambikapur', 'Bhatapara', 'Dhamtari', 'Rajnandgaon', 'Mahasamund', 'Chirmiri', 'Kanker', 'Janjgir', 'Korba', 'Dalli-Rajhara', 'Tilda Newra', 'Mungeli', 'Manendragarh', 'Kawardha', 'Khairagarh', 'Gharghoda', 'Balod'],
  'Goa': ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda', 'Mormugao', 'Bicholim', 'Curchorem', 'Canacona', 'Quepem', 'Sanguem', 'Pernem', 'Valpoi', 'Sanvordem', 'Cuncolim'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Gandhidham', 'Anand', 'Nadiad', 'Surendranagar', 'Bharuch', 'Mehsana', 'Bhuj', 'Porbandar', 'Veraval', 'Navsari', 'Valsad', 'Palanpur', 'Modasa', 'Palanpur', 'Patan', 'Godhra', 'Dahod', 'Botad', 'Ankleshwar', 'Kalol', 'Himmatnagar', 'Morbi'],
  'Haryana': ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Kurukshetra', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Kaithal', 'Palwal', 'Rewari', 'Hansi', 'Narnaul', 'Thanesar', 'Fatehabad', 'Mahendragarh', 'Jhajjar', 'Panchkula', 'Pinjore', 'Rania', 'Safidon', 'Tohana', 'Narwana', 'Ellenabad'],
  'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala', 'Bilaspur', 'Kullu', 'Chamba', 'Hamirpur', 'Una', 'Nahan', 'Sundarnagar', 'Palampur', 'Kangra', 'Kasauli', 'Manali', 'Dalhousie', 'Chamba', 'Kullu', 'Solan', 'Sirmaur', 'Keylong', 'Reckong Peo', 'Kaza', 'Mandi', 'Baddi', 'Parwanoo', 'Nalagarh', 'Paonta Sahib'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Udhampur', 'Kathua', 'Rajouri', 'Poonch', 'Doda', 'Kupwara', 'Bandipora', 'Pulwama', 'Shopian', 'Kulgam', 'Budgam', 'Ganderbal', 'Samba', 'Reasi', 'Ramban', 'Kishtwar', 'Kargil', 'Leh', 'Handwara', 'Pattan', 'Bijbehara', 'Awantipora', 'Pampore', 'Tral', 'Khanabal'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih', 'Ramgarh', 'Medininagar', 'Chaibasa', 'Hazaribagh', 'Dumka', 'Phusro', 'Adityapur', 'Chatra', 'Gumla', 'Lohardaga', 'Pakur', 'Simdega', 'Sahebganj', 'Jharia', 'Mango', 'Tatanagar', 'Chirkunda', 'Mugma', 'Basukinath', 'Madhupur', 'Koderma', 'Jhumri Tilaiya', 'Latehar'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davangere', 'Bellary', 'Bijapur', 'Raichur', 'Shimoga', 'Tumkur', 'Udupi', 'Chitradurga', 'Kolar', 'Mandya', 'Hassan', 'Bidar', 'Chamrajnagar', 'Chikkamagaluru', 'Gadag', 'Haveri', 'Bagalkot', 'Karwar', 'Madikeri', 'Chikkaballapur', 'Yadgir', 'Koppal', 'Vijayapura', 'Kalaburagi'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Malappuram', 'Kannur', 'Kollam', 'Alappuzha', 'Palakkad', 'Kottayam', 'Thrissur', 'Kochi', 'Kannur', 'Kasaragod', 'Pathanamthitta', 'Idukki', 'Wayanad', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod', 'Alappuzha', 'Kollam', 'Pathanamthitta', 'Kottayam', 'Idukki'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Raipur', 'Satna', 'Rewa', 'Katni', 'Burhanpur', 'Sagar', 'Ratlam', 'Dewas', 'Singrauli', 'Murwara', 'Satna', 'Morena', 'Bhind', 'Guna', 'Shivpuri', 'Vidisha', 'Chhindwara', 'Khandwa', 'Harda', 'Hoshangabad', 'Itarsi', 'Sehore', 'Mandsaur', 'Neemuch', 'Shajapur'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Jalna', 'Bhusawal', 'Panvel', 'Satara', 'Beed', 'Yavatmal', 'Kamptee', 'Gondia', 'Barshi', 'Achalpur', 'Osmanabad', 'Nanded', 'Wardha'],
  'Manipur': ['Imphal', 'Thoubal', 'Kakching', 'Lilong', 'Mayang Imphal', 'Churachandpur', 'Ukhrul', 'Bishnupur', 'Tamenglong', 'Chandel', 'Senapati', 'Jiribam', 'Kangpokpi', 'Moreh', 'Wangjing', 'Moirang', 'Kakching', 'Lamlai', 'Yairipok'],
  'Meghalaya': ['Shillong', 'Tura', 'Nongstoin', 'Jowai', 'Baghmara', 'Resubelpara', 'Nongpoh', 'Williamnagar', 'Mairang', 'Mawkyrwat', 'Nongpoh', 'Khliehriat', 'Ampati', 'Dadenggre', 'Mawphlang'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Lawngtlai', 'Mamit', 'Saitual', 'Khawzawl', 'Hnahthial', 'Siaha', 'Thenzawl', 'Lunglei', 'Sairang'],
  'Nagaland': ['Dimapur', 'Kohima', 'Mokokchung', 'Tuensang', 'Wokha', 'Mon', 'Zunheboto', 'Phek', 'Kiphire', 'Longleng', 'Peren', 'Noklak', 'Chumukedima', 'Medziphema', 'Pfutsero'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Baleshwar', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Bargarh', 'Balangir', 'Rayagada', 'Jeypore', 'Paradip', 'Jagatsinghpur', 'Kendrapara', 'Bhadrak', 'Jajpur', 'Dhenkanal', 'Angul', 'Talcher', 'Barbil', 'Keonjhar', 'Phulbani', 'Kandhamal', 'Gajapati', 'Koraput', 'Malkangiri', 'Nabarangpur'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Pathankot', 'Hoshiarpur', 'Mohali', 'Moga', 'Firozpur', 'Batala', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara', 'Kapurthala', 'Sultanpur Lodhi', 'Dasuya', 'Mukerian', 'Nawanshahr', 'Phillaur', 'Qadian', 'Rupnagar', 'Sangrur', 'Barnala', 'Fazilka', 'Gurdaspur', 'Mansa', 'Tarn Taran', 'Zira'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Tonk', 'Sawai Madhopur', 'Barmer', 'Jaisalmer', 'Churu', 'Nagaur', 'Hanumangarh', 'Sri Ganganagar', 'Jhalawar', 'Banswara', 'Dungarpur', 'Pratapgarh', 'Rajsamand', 'Dholpur', 'Karauli', 'Bundi', 'Chittorgarh', 'Jalore', 'Sirohi'],
  'Sikkim': ['Gangtok', 'Namchi', 'Mangan', 'Gyalshing', 'Singtam', 'Rangpo', 'Jorethang', 'Melli', 'Pakyong', 'Rhenock', 'Rongli', 'Ravangla', 'Pelling', 'Lachen', 'Lachung'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Tiruppur', 'Hosur', 'Kanchipuram', 'Nagercoil', 'Karaikudi', 'Neyveli', 'Cuddalore', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam', 'Sivakasi', 'Pudukkottai', 'Vaniyambadi', 'Tiruchengode', 'Kumbakonam', 'Ooty', 'Coimbatore', 'Salem', 'Erode'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahabubnagar', 'Adilabad', 'Nalgonda', 'Siddipet', 'Suryapet', 'Miryalaguda', 'Jagtial', 'Kamareddy', 'Peddapalli', 'Nirmal', 'Bellampalle', 'Bhongir', 'Bodhan', 'Huzurabad', 'Jangaon', 'Koratla', 'Mancherial', 'Medak', 'Metpally', 'Narayanpet', 'Nizamabad', 'Sangareddy', 'Vikarabad', 'Wanaparthy'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar', 'Belonia', 'Khowai', 'Teliamura', 'Ambassa', 'Kumarghat', 'Sabroom', 'Amarpur', 'Bishalgarh', 'Kailashahar', 'Kamalpur', 'Khowai', 'Melaghar', 'Pratapgarh', 'Sonamura', 'Udaipur'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut', 'Ghaziabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Fatehpur', 'Sitapur', 'Hardoi', 'Unnao', 'Raebareli', 'Etawah', 'Mainpuri', 'Budaun', 'Pilibhit', 'Lakhimpur'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Mussoorie', 'Nainital', 'Almora', 'Pithoragarh', 'Udham Singh Nagar', 'Chamoli', 'Pauri', 'Tehri', 'Uttarkashi', 'Champawat', 'Bageshwar', 'Ranikhet', 'Kotdwar', 'Srinagar', 'Joshimath', 'Badrinath', 'Kedarnath', 'Gangotri', 'Yamunotri'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur', 'Ranaghat', 'Jalpaiguri', 'Baharampur', 'Hugli-Chinsurah', 'Krishnanagar', 'Bardhaman', 'English Bazar', 'Raiganj', 'Cooch Behar', 'Alipurduar', 'Balurghat', 'Bankura', 'Barasat', 'Barrackpore', 'Basirhat', 'Bhatpara', 'Chandannagar', 'Darjeeling', 'Diamond Harbour', 'Dum Dum', 'Habra', 'Haldia'],
  'Andaman and Nicobar Islands': ['Port Blair', 'Car Nicobar', 'Havelock', 'Mayabunder', 'Diglipur', 'Rangat', 'Little Andaman', 'Baratang', 'Neil Island', 'Long Island', 'Hut Bay', 'Campbell Bay', 'Bambooflat', 'Wandoor'],
  'Chandigarh': ['Chandigarh', 'Sector 17', 'Sector 22', 'Sector 35', 'Sector 43', 'Manimajra'],
  'Dadra and Nagar Haveli': ['Silvassa', 'Masat', 'Dadra', 'Naroli', 'Khanvel', 'Amli', 'Kadaiya', 'Dudhani'],
  'Daman and Diu': ['Daman', 'Diu', 'Nani Daman', 'Dabhel', 'Kachigam', 'Moti Daman'],
  'Delhi': ['New Delhi', 'Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad', 'Greater Noida', 'Dwarka', 'Rohini', 'Pitampura', 'Laxmi Nagar', 'Karol Bagh', 'Connaught Place', 'Chanakyapuri', 'Vasant Kunj', 'Saket', 'Lajpat Nagar', 'Hauz Khas', 'Rajouri Garden'],
  'Lakshadweep': ['Kavaratti', 'Agatti', 'Amini', 'Andrott', 'Kalpeni', 'Minicoy', 'Kadmat', 'Chetlat', 'Bitra', 'Kiltan', 'Bangaram', 'Kadmat'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Yanam', 'Mahe', 'Ozhukarai', 'Villianur', 'Bahour', 'Nettapakkam', 'Ariyankuppam']
}

function UserInfo({ onBack, onNext, initialData }) {
  const [fullName, setFullName] = useState(initialData?.fullName || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [gender, setGender] = useState(initialData?.gender || '')
  const [state, setState] = useState(initialData?.state || '')
  const [city, setCity] = useState(initialData?.city || '')
  const [streetAddress, setStreetAddress] = useState(initialData?.address || '')
  const [pincode, setPincode] = useState(initialData?.pincode || '')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const phoneNumberValue = initialData?.fullPhoneNumber || initialData?.phoneNumber || ''

  const cities = useMemo(() => {
    return state && statesAndCities[state] ? statesAndCities[state] : []
  }, [state])

  const handleStateChange = (e) => {
    const newState = e.target.value
    setState(newState)
    setCity('')
    if (errors.state || errors.city) {
      setErrors({ ...errors, state: '', city: '' })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!gender) {
      newErrors.gender = 'Gender is required'
    }
    if (!state) {
      newErrors.state = 'State is required'
    }
    if (!city) {
      newErrors.city = 'City is required'
    }
    if (!streetAddress.trim()) {
      newErrors.address = 'Address is required'
    }
    const trimmedPincode = pincode.trim()
    if (!trimmedPincode) {
      newErrors.pincode = 'Pincode is required'
    } else if (!/^\d{6}$/.test(trimmedPincode)) {
      newErrors.pincode = 'Enter a valid 6-digit pincode'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setFormError('')

    const phoneForRegister = initialData?.fullPhoneNumber || initialData?.phoneNumber
    const payload = {
      fullName: fullName.trim(),
      full_name: fullName.trim(),
      email: email.trim(),
      gender,
      state,
      city,
      address: streetAddress.trim(),
      pincode: trimmedPincode,
      phoneNumber: phoneForRegister,
      phone_number: phoneForRegister,
      countryCode: initialData?.countryCode,
      ...initialData
    }

    console.log('UserInfo data being passed:', payload)
    onNext?.(payload)
  }

  const isFormValid =
    fullName.trim() &&
    email.trim() &&
    gender &&
    state &&
    city &&
    streetAddress.trim() &&
    /^\d{6}$/.test(pincode.trim())

  return (
    <div className="user-info-container">
      <div className="user-info-content">
        <div className="user-info-header-section">
          <button className="user-info-back-button" onClick={onBack} aria-label="Go back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="12" x2="6" y2="12" stroke="black" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 12L12 6M6 12L12 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="user-info-body">
          <h1 className="user-info-heading">
            We would love to know <span className="user-info-heading-orange">about you</span>
          </h1>

          <form className="user-info-form" onSubmit={handleSubmit} noValidate>
            <div className="user-info-field">
              <label className="user-info-label">
                Full Name<span className="required-star">*</span>
              </label>
              <input
                type="text"
                className={`user-info-input ${errors.fullName ? 'error' : ''}`}
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  if (errors.fullName) {
                    setErrors({ ...errors, fullName: '' })
                  }
                }}
              />
              {errors.fullName && <p className="user-info-error">{errors.fullName}</p>}
            </div>

            <div className="user-info-field">
              <label className="user-info-label">
                Email<span className="required-star">*</span>
              </label>
              <input
                type="email"
                className={`user-info-input ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) {
                    setErrors({ ...errors, email: '' })
                  }
                }}
              />
              {errors.email && <p className="user-info-error">{errors.email}</p>}
            </div>

            <div className="user-info-field">
              <label className="user-info-label">
                Mobile Number<span className="required-star">*</span>
              </label>
              <input
                type="tel"
                className="user-info-input readonly"
                value={phoneNumberValue}
                readOnly
                aria-readonly="true"
              />
            </div>

            <div className="user-info-field">
              <label className="user-info-label">
                Gender<span className="required-star">*</span>
              </label>
              <div className="user-info-select-wrapper">
                <select
                  className={`user-info-select ${errors.gender ? 'error' : ''}`}
                  value={gender}
                  onChange={(e) => {
                    setGender(e.target.value)
                    if (errors.gender) {
                      setErrors({ ...errors, gender: '' })
                    }
                  }}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <svg className="user-info-select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {errors.gender && <p className="user-info-error">{errors.gender}</p>}
            </div>

            <div className="user-info-field">
              <label className="user-info-label">
                State<span className="required-star">*</span>
              </label>
              <div className="user-info-select-wrapper">
                <select
                  className={`user-info-select ${errors.state ? 'error' : ''}`}
                  value={state}
                  onChange={handleStateChange}
                >
                  <option value="">Select state</option>
                  {Object.keys(statesAndCities).map((stateName) => (
                    <option key={stateName} value={stateName}>
                      {stateName}
                    </option>
                  ))}
                </select>
                <svg className="user-info-select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {errors.state && <p className="user-info-error">{errors.state}</p>}
            </div>

            <div className="user-info-field">
              <label className="user-info-label">
                City<span className="required-star">*</span>
              </label>
              <div className="user-info-select-wrapper">
                <select
                  className={`user-info-select ${errors.city ? 'error' : ''}`}
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value)
                    if (errors.city) {
                      setErrors({ ...errors, city: '' })
                    }
                  }}
                  disabled={!state}
                >
                  <option value="">Select city</option>
                  {cities.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
                <svg className="user-info-select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {errors.city && <p className="user-info-error">{errors.city}</p>}
            </div>

        <div className="user-info-field">
          <label className="user-info-label">
            Address<span className="required-star">*</span>
          </label>
          <textarea
            className={`user-info-input ${errors.address ? 'error' : ''}`}
            placeholder="House / Street / Landmark"
            rows={3}
            value={streetAddress}
            onChange={(e) => {
              setStreetAddress(e.target.value)
              if (errors.address) {
                setErrors({ ...errors, address: '' })
              }
            }}
          />
          {errors.address && <p className="user-info-error">{errors.address}</p>}
        </div>

        <div className="user-info-field">
          <label className="user-info-label">
            Pincode<span className="required-star">*</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className={`user-info-input ${errors.pincode ? 'error' : ''}`}
            placeholder="Enter 6-digit pincode"
            value={pincode}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, '')
              setPincode(digitsOnly)
              if (errors.pincode) {
                setErrors({ ...errors, pincode: '' })
              }
            }}
          />
          {errors.pincode && <p className="user-info-error">{errors.pincode}</p>}
        </div>

            {formError && <p className="user-info-error form-error">{formError}</p>}

            <button
              type="submit"
              className={`user-info-next-button ${!isFormValid ? 'disabled' : ''}`}
              disabled={!isFormValid}
            >
              Next
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserInfo


