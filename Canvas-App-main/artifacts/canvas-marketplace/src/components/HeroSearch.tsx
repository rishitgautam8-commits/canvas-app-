import React, { useRef, useState } from 'react';
import { Search, ArrowRight, Sparkles, Upload, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTheme } from '@/lib/theme';

export interface HeroSearchValue {
  services: string[];
  location: string;
  date: string;
  timeSlot: 'Morning (08:00 - 13:00)' | 'Evening (15:00 - 20:00)';
  priceRange: string;
  lookDescription: string;
  inspirationFile?: File | null;
}

interface HeroSearchProps {
  value: HeroSearchValue;
  onChange: (val: HeroSearchValue) => void;
  onSubmit: (val: HeroSearchValue) => void;
  onAuthRequired?: () => void;
  isAuthenticated?: boolean;
}

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
  'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Varanasi',
  'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Howrah', 'Ranchi', 'Gwalior', 'Jabalpur',
  'Coimbatore', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli-Dharwad',
  'Bareilly', 'Moradabad', 'Mysore', 'Gurgaon', 'Aligarh', 'Jalandhar', 'Tiruchirappalli', 'Bhubaneswar', 'Salem', 'Mira-Bhayandar',
  'Warangal', 'Thiruvananthapuram', 'Bhiwandi', 'Saharanpur', 'Guntur', 'Amravati', 'Bikaner', 'Noida', 'Jamshedpur', 'Bhilai',
  'Cuttack', 'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun', 'Durgapur', 'Asansol', 'Rourkela', 'Nanded',
  'Kolhapur', 'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi', 'Ulhasnagar',
  'Jammu', 'Sangli-Miraj', 'Mangalore', 'Erode', 'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon',
  'Udaipur', 'Maheshtala', 'Davanagere', 'Kozhikode', 'Kurnool', 'Rajahmundry', 'Bokaro', 'South Dumdum', 'Bellary', 'Patiala',
  'Gopalpur', 'Agartala', 'Bhagalpur', 'Muzaffarnagar', 'Bhatpara', 'Panihati', 'Latur', 'Dhule', 'Tirupati', 'Rohtak',
  'Korba', 'Bhilwara', 'Berhampur', 'Muzaffarpur', 'Ahmednagar', 'Mathura', 'Kollam', 'Avadi', 'Kadapa', 'Kamarhati',
  'Sambalpur', 'Bilaspur', 'Shahjahanpur', 'Satara', 'Bijapur', 'Rampur', 'Shivamogga', 'Chandrapur', 'Junagadh', 'Thrissur',
  'Alwar', 'Bardhaman', 'Kulti', 'Kakinada', 'Nizamabad', 'Parbhani', 'Tumkur', 'Khammam', 'Ozhukarai', 'Bihar Sharif',
  'Panipat', 'Darbhanga', 'Bally', 'Aizawl', 'Dewas', 'Ichalkaranji', 'Karnal', 'Bathinda', 'Jalna', 'Eluru',
  'Barasat', 'Purnia', 'Satna', 'Mau', 'Sonipat', 'Farrukhabad', 'Sagar', 'Durg', 'Imphal', 'Ratlam',
  'Hapur', 'Arrah', 'Karimnagar', 'Anantapur', 'Etawah', 'Ambernath', 'North Dumdum', 'Bharatpur', 'Begusarai', 'New Delhi',
  'Gandhidham', 'Baranagar', 'Tiruvottiyur', 'Pondicherry', 'Sikar', 'Thoothukudi', 'Rewa', 'Mirzapur', 'Raichur', 'Pali',
  'Ramagundam', 'Haridwar', 'Vijayanagaram', 'Katihar', 'Nagarcoil', 'Sri Ganganagar', 'Mango', 'Thanjavur', 'Bulandshahr', 'Uluberia',
  'Murwara', 'Sambhal', 'Singrauli', 'Nadiad', 'Secunderabad', 'Naihati', 'Yamunanagar', 'Bidhannagar', 'Pallavaram', 'Bidar',
  'Munger', 'Panchkula', 'Burhanpur', 'Kharagpur', 'Dindigul', 'Gandhinagar', 'Hospet', 'Nangloi Jat', 'Malda', 'Ongole',
  'Deoghar', 'Chapra', 'Haldia', 'Khandwa', 'Nandyal', 'Chittoor', 'Morena', 'Amroha', 'Anand', 'Bhind',
  'Bhiwani', 'Navghar-Manikpur', 'Baharampur', 'Ambala', 'Morvi', 'Fatehpur', 'Rae Bareli', 'Khora', 'Bhusawal', 'Orai',
  'Bahraich', 'Vellore', 'Mahesana', 'Raiganj', 'Sirsa', 'Danapur', 'Serampore', 'Guna', 'Jaunpur', 'Panvel',
  'Shivpuri', 'Unnao', 'Chinsurah', 'Alappuzha', 'Kottayam', 'Machilipatnam', 'Shimla', 'Adoni', 'Udupi', 'Proddatur',
  'Mahbubnagar', 'Saharsa', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Silchar', 'Bongaigaon', 'Tezpur', 'Kohima',
  'Dimapur', 'Shillong', 'Tura', 'Gangtok', 'Itanagar', 'Naharlagun', 'Pasighat', 'Lunglei', 'Dharmanagar', 'Port Blair',
  'Kavaratti', 'Daman', 'Diu', 'Silvassa', 'Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Karwar',
  'Gokak', 'Shahabad', 'Sirsi', 'Sindhnur', 'Tiptur', 'Chitradurga', 'Hassan', 'Mandya', 'Chikkamagaluru', 'Bagalkot',
  'Gadag-Betageri', 'Bhadravati', 'Kolar', 'Moga', 'Abohar', 'Pathankot', 'Hoshiarpur', 'Batala', 'Khanna', 'Phagwara',
  'Muktsar', 'Barnala', 'Rajpura', 'Firozpur', 'Kapurthala', 'Sunam', 'Gurdaspur', 'Fazilka', 'Tarn Taran', 'Jagraon',
  'Mandi Gobindgarh', 'Rupnagar', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Bargarh', 'Rayagada', 'Kendrapara',
  'Malkangiri', 'Parlakhemundi', 'Bobbili', 'Tuni', 'Chilakaluripet', 'Narsaraopet', 'Kavali', 'Gudur', 'Tenali', 'Mangalagiri',
  'Bapatla', 'Ponnur', 'Narasapur', 'Tadepalligudem', 'Bhimavaram', 'Palakollu', 'Tanuku', 'Mandapeta', 'Amalapuram', 'Pithapuram',
  'Samalkota', 'Tadipatri', 'Dharmavaram', 'Hindupur', 'Kadiri', 'Guntakal', 'Rayachoti', 'Rajampet', 'Madanapalle', 'Punganur',
  'Srikalahasti', 'Puttur', 'Palasa Kasibugga', 'Parvathipuram', 'Yemmiganur', 'Rayadurg', 'Kalyandurg', 'Nuzvid', 'Jaggaiahpet', 'Macherla',
  'Sattenapalle', 'Vinukonda', 'Markapur', 'Kandukur', 'Yerraguntla', 'Jammalamadugu', 'Badvel', 'Mydukur', 'Pulivendula', 'Giddalur',
  'Atmakur', 'Nandikotkur', 'Allagadda', 'Nandigama', 'Vuyyuru', 'Pedana', 'Gudivada', 'Amadalavalasa', 'Ichchapuram', 'Ramachandrapuram',
  'Kothapeta', 'Kovvur', 'Nidadavole', 'Jangareddygudem', 'Chintalapudi', 'Kondapalli', 'Tiruvuru', 'Repalle', 'Tadepalle', 'Piduguralla',
  'Addanki', 'Chirala', 'Venkatagiri', 'Nagari', 'Palamaner', 'Kuppam', 'Dhone', 'Banaganapalle', 'Bapatla', 'Tenali'
];

const analysisSteps = [
  "Isolating color palettes & lighting undertones...",
  "Mapping facial geometry & aesthetic drape...",
  "Cross-referencing verified studio portfolios...",
  "Curating optimal matches based on style & location..."
];

const OCCASIONS = ['Wedding', 'Shoot', 'Party', 'Editorial', 'Everyday'];
const SUGGESTION_PILLS = ['Pinterest board', 'Instagram screenshot', 'Mood board', 'Magazine cutout'];

export function HeroSearch({ value, onChange, onSubmit, onAuthRequired, isAuthenticated }: HeroSearchProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeOccasion, setActiveOccasion] = useState('Wedding');
  
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const styleVersion = queryParams.get('style') || '2';
  const theme = getTheme(styleVersion);
  
  const accentColor = styleVersion === '3' ? '#7A4B69' : '#9D7C3A';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchContext = {
      ...value,
      lookDescription: `${value.lookDescription || ''} ${activeOccasion}`.trim()
    };
    onSubmit(searchContext);
  };

  const filteredLocations = INDIAN_CITIES.filter(loc =>
    loc.toLowerCase().includes((value?.location || '').toLowerCase())
  );

  const handleFileSelected = (file: File) => {
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsAnalyzing(true);
    setCurrentStep(0);

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analysisSteps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 600);

    setTimeout(() => {
      setIsAnalyzing(false);
      const searchContext = { ...value, inspirationFile: file, lookDescription: activeOccasion };
      onChange(searchContext);
      onSubmit(searchContext);
    }, 2600);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelected(file);
    } else {
      window.alert("Please drop a valid image file.");
    }
  };

  return (
    <div className={`w-full max-w-[960px] mx-auto relative z-20 ${theme.fontBase}`}>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={`bg-white/40 backdrop-blur-md p-8 md:p-14 shadow-sm border ${theme.borderBase} ${theme.cardRadius} relative overflow-visible`}
      >
        <form onSubmit={handleSubmit}>
          
          <div className="flex flex-col md:flex-row gap-4 mb-10 relative">
            
            <div className={`flex-[2] flex items-center bg-white/50 backdrop-blur-sm border ${theme.borderBase} ${theme.cardRadius} px-6 py-4 shadow-sm transition-all duration-300 focus-within:bg-white/70`}>
              <Search size={20} className="mr-4 opacity-40 shrink-0 text-black" />
              <input
                type="text"
                value={value?.lookDescription || ''}
                onChange={(e) => onChange({ ...value, lookDescription: e.target.value })}
                placeholder="nizami bridal, soft glam..."
                className={`w-full bg-transparent outline-none text-black placeholder:text-black/40 ${theme.fontBase} text-base`}
              />
            </div>

            <div className={`flex-[1.5] relative flex items-center bg-white/50 backdrop-blur-sm border ${theme.borderBase} ${theme.cardRadius} px-6 py-4 shadow-sm transition-all duration-300 focus-within:bg-white/70`}>
              <MapPin size={20} className="mr-4 shrink-0" color={accentColor} />
              <input
                type="text"
                value={value?.location || ''}
                onChange={(e) => {
                  onChange({ ...value, location: e.target.value });
                  setShowLocationDropdown(true);
                }}
                onFocus={() => setShowLocationDropdown(true)}
                placeholder="anywhere in india"
                className={`w-full bg-transparent outline-none text-black placeholder:text-black/40 ${theme.fontBase} text-base`}
              />
              
              {showLocationDropdown && filteredLocations.length > 0 && (
                <div className={`absolute top-[110%] left-0 w-full bg-white/90 backdrop-blur-xl border ${theme.borderBase} ${theme.cardRadius} shadow-xl z-50 max-h-56 overflow-y-auto py-2`}>
                  {filteredLocations.map(loc => (
                    <div
                      key={loc}
                      onClick={() => {
                        onChange({ ...value, location: loc });
                        setShowLocationDropdown(false);
                      }}
                      className={`px-6 py-3 cursor-pointer transition-colors hover:bg-black/5 ${theme.fontBase} text-black`}
                    >
                      {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              onClick={() => setShowLocationDropdown(false)}
              className={`${theme.btnPrimary} flex items-center justify-center gap-3 shrink-0 py-4`}
            >
              find artist <ArrowRight size={18} strokeWidth={2} />
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 mb-10">
            <span className={`${theme.eyebrow} !text-black/50`}>
              or upload inspiration
            </span>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!isAuthenticated) {
                onAuthRequired?.();
              } else {
                fileInputRef.current?.click();
              }
            }}
            className={`relative border border-dashed p-10 md:p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 ease-out ${theme.cardRadius} ${
              isDragging 
                ? 'bg-white/60 scale-[1.01] border-black/40 shadow-sm' 
                : `bg-white/20 ${theme.borderBase} hover:border-black/30 hover:bg-white/40`
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
            />

            <div className={`w-14 h-14 bg-white/60 backdrop-blur-sm flex items-center justify-center mb-6 border ${theme.borderBase} shadow-sm ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-full'}`}>
              <Upload size={20} strokeWidth={1.5} color={accentColor} />
            </div>

            <h3 className={`${theme.headingModal} !text-2xl md:!text-3xl mb-4 flex flex-col items-center gap-1`}>
              <span className="block">Upload A Pinterest Screenshot</span>
              <span className="block">Or Instagram Save</span>
            </h3>
            <p className={`${theme.formLabel} !text-black/50 mb-10`}>
              jpg, png, webp · max 10mb · or drag & drop
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {SUGGESTION_PILLS.map((pill) => (
                <span key={pill} className={`bg-white/40 border ${theme.borderBase} px-5 py-2.5 ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-full'} ${theme.formLabel} !text-black/70 shadow-sm`}>
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-start gap-6 border-t border-black/5 pt-8">
            <span className={`${theme.eyebrow} !text-black/50`}>
              occasion:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {OCCASIONS.map((occasion) => (
                <button
                  key={occasion}
                  type="button"
                  onClick={() => setActiveOccasion(occasion)}
                  className={`px-6 py-2.5 transition-all duration-300 border ${theme.cardRadius} ${theme.formLabel} ${
                    activeOccasion === occasion
                      ? 'bg-black text-white border-black shadow-md'
                      : `bg-transparent text-black/60 ${theme.borderBase} hover:bg-white/50 hover:text-black`
                  }`}
                >
                  {occasion}
                </button>
              ))}
            </div>
          </div>

        </form>
      </motion.div>

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#FDF3F1]/80 backdrop-blur-xl p-6 ${theme.fontBase}`}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className={`relative max-w-md w-full bg-white/80 backdrop-blur-xl border ${theme.borderBase} ${theme.cardRadius} p-10 text-center shadow-2xl overflow-hidden`}
            >
              <motion.div
                animate={{ y: ['0%', '100%', '0%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-black/20 to-transparent z-20"
              />

              {previewUrl && (
                <div className={`relative w-36 h-36 mx-auto mb-8 overflow-hidden border ${theme.borderBase} shadow-inner ${theme.cardRadius}`}>
                  <img src={previewUrl} alt="Inspiration Preview" className="w-full h-full object-cover filter brightness-95 grayscale-[20%]" />
                  <div className="absolute inset-0 mix-blend-overlay" style={{ backgroundColor: accentColor, opacity: 0.15 }} />
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles size={18} className="animate-spin" color={accentColor} />
                <span className={theme.eyebrow}>canvas ai vision</span>
              </div>

              <h3 className={`${theme.headingModal} !text-3xl mb-8 leading-tight`}>
                Analyzing Aesthetic Match...
              </h3>

              <div className="h-8 flex items-center justify-center mb-2">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className={theme.formLabel}
                  >
                    {analysisSteps[currentStep]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="w-full bg-black/5 h-[2px] mt-6 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.5, ease: 'easeInOut' }}
                  className="h-full"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HeroSearch;