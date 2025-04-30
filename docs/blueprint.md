# **App Name**: EcoTest Insight

## Core Features:

- Cost Calculation: Calculate energy consumption, energy cost, fixed costs, and total costs for thermal and vibration tests based on user inputs (test type, method, equipment, duration) and CSV data.
- Environmental Impact Prediction: Predict carbon footprint (CO2 emissions) for each test based on energy consumption and emission factors. Also predicts the additional cost with an old chamber.
- Predictive Maintenance Cost Analysis: Analyzes historical maintenance and fluid replacement data to predict future maintenance costs. This prediction is a tool to help clients invest in maintenance.

## Style Guidelines:

- Primary color: A calming blue (#3498db) to represent reliability and engineering precision.
- Secondary color: A clean white (#ffffff) for backgrounds to ensure readability.
- Accent color: A vibrant green (#2ecc71) to highlight key metrics and positive environmental impact.
- Clean and structured layout for easy navigation and data input.
- Use clear, technical icons to represent different test types and parameters.

## Original User Request:
Im an energy engineer student in my final year project My project is to create a web application that can predict cost of thermal (in thermal chambers) and vibration (in vibrating pots) tests for products resilience according to the standard IEC 60068-2 in the qualification laboratory of ACTIA engineering services in tunisia before even start the test, dedicated to clients (users) that come to our laboratory to test there products (like motors , mecanical and electrical products) with the change in tempreture and for vibration capacity . In all this i should create this app that calculate the energy costs from consumptions in csv files and total costs (energy costs + fixed costs) and teh other things (suggested by you) to make it more for energy enginnering field and to make it something big for my final year's project .                                 Main Testing Standards are : 
for thermal tests :
	(IEC 60068-2-1 , 
	IEC 60068-2-2 , 
	IEC 60068-2-14 , 
	IEC 60068-2-30 , 
	IEC 60068-2-38 , 
	IEC 60068-2-78) 
and for vibration :
	(IEC 60068-2-6 , 
	IEC 60068-2-27 , 
	IEC 60068-2-64). 
in my csv files ; 
	i have the Equipment Power Consumption for each test but per hour so the client input the number of hours for calculating the consumption of the whole test. 
	There is no need to put the product type.
	for (Country/Location : Tunisia always) 
	Electricity Cost (euro) per kWh = 0.135 euro/kWh. 
	Emission Factor (kg CO₂/kWh) = 0,58 kg CO₂/kWh. 
	fixed costs : RH = 210 euros per test , 
	Transport / Emballage = 150 euros per test , 
	if we use a vibrating pot ; the client must pay 100 euros per hour , 
	if we use a thermal chamber; the client must pay 5 euros per hour , 
	if we use the thermal shock chamber ; the client must pay 7,5 euros per hour , 
	if we use the vibrating pot combined with a thermal chamber; the client must pay 105 euros per hour , 
	Maintenance 3 times per year that you can pridict their costs  
	buying the frigorific fluids (R23 and R404A) 2 times a year . 

For the calculations part ;
	The energy consmptions is known and writen in the csv files , 
	you can calculate the energy cost by mutipling the energy consumption (kWh) by the Electricity Cost (euro per kWh). 
For the others you can : 
	Predict Fixed Costs (those that i dont know their costs)
	Predict Carbon Footprint (CO₂ emissions) for tunisia 
	predict the additional cost if we are using an old chamber or pot (because their is des fuites ,etc.....) 
for giving the clients a better view ; i want to show them if they invest in a photovoltaic installation for our laboratory ; the costs will decrease for a certain amount that is big because it will erase the energy costs and the footprint taxes and that will help them a lot ( compare between them) and i want you to suggest other things to make the users want to invest in our enrgy field of our laboratory My Workflow ; register or log in / test type ; standard (IEC 60068); method (thermal (2-1, 2-2, 2-14, 2-30, 2-38, 2-78) or vibration (2-6, 2-27, 2-64)) ; equipment ( thermal chamber, thermal shock chamber or vibrating pot) / initial temperature, recovery tempreture, low tempreture, high tempreture, number of hours
 to be clear i want every thing in english Test type (thermal, vibration, thermal shoc or combined) cause each of them have a diffrent cost. also i have 6 types of the thermal tests with the same standard IEC 60068 but every test have a method ( 2-1, 2-2, 2-14, 2-30, 2-38, 2-78) , the initial tempreture and the recovery tempreture are commun in all the methods (they are equal 25°C the two of them) but other than that; every method have their own obligation to fullfil (ex: (2-1 A) recure the low tempreture (LT) but the (2-2 B) recure the high tempreture (HT) , 2-14 recure LT and HT for the thermal shoc (2-14 Na) and recure LT and HT and variation of vilocity of tempreture (°C/min) for (2-14 Nb), for (2-30) there are 2 variants V1 and V2 the two of them recure HT and duration=1cycle = 24hours , and for (2-38) recure LT and HT but wit works in 10 cycle =240hours as minimum duration and finally 2-78 recure fumidity (85% or 93%) and HT )
Also in my csv files i have the power (kW) of every test but the others is for calculation in the application so you can calculate the enrgy consumption (kWh) by multiplying the power with the number of hours (duration of the test) and then calculate the energy cost (euro) by multiplying the energy consumption with 0.135 euros/kWh (cost of 1 kWh) i cant use an ID or a frequence because clients doesnt know them , it must be clear to them to chose the right test. test duration in hours also it must be a csv file for the thermal chambers and the vibration pots cause each of them have diffrent consumption and their date of fabrication. i dont want a users.csv cause every user can create an account but with my acceptance.
  