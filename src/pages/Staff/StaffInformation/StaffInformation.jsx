import React from "react";

const StaffInformation = () => {
  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col">
      {/* Header - full width */}
      <div className="w-full bg-blue-200 py-4 flex items-center justify-center relative">
        {/* Logo on the left */}
        <div className="absolute left-6 flex items-center">
          <img
            src="./src/assets/img/logoremovebg.png"
            alt="Logo"
            className="w-16 h-16"
          />
        </div>

        {/* PROFILE text */}
        <h1 className="text-2xl font-bold text-gray-800">PROFILE</h1>

        {/* Avatar on the right */}
        <div className="absolute right-6">
          <img
            src="./src/assets/img/MyDung.jpg"
            alt="User Avatar"
            className="w-10 h-10 rounded-full border-2 border-white shadow-md"
          />
        </div>
      </div>

      {/* Main Content - With rounded corners and inset from edges */}
      <div className="flex-1 bg-gray-100 p-8">
        <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-lg">
          {/* Top image banner */}
          <div className="w-full h-50 bg-cover bg-center relative" 
               style={{ backgroundImage: "url('./src/assets/img/StaffInforBG.jpg')" }}>
            {/* Name and position overlay on the image, aligned with profile pic */}
            <div className="absolute bottom-0 left-64 text-white pb-1">
              <h2 className="text-lg font-bold">Tran Thi My Dung</h2>
              <p className="text-sm">Position: Staff</p>
            </div>
          </div>

          {/* Content area with white background */}
          <div className="bg-gray-100 p-8 relative">
            {/* Profile avatar positioned on the left, overlapping the banner */}
            <div className="absolute -top-16 left-24">
              <div className="p-1 bg-white rounded-full shadow-lg">
                <img
                  src="./src/assets/img/MyDung.jpg"
                  alt="Staff Avatar"
                  className="w-32 h-33 rounded-full border-2 border-white"
                />
                

              </div>
            </div>

            {/* Main content containers - starts below the profile pic */}
            <div className="w-full flex pt-20 gap-6">
              {/* Left column with two panels */}
              <div className="w-1/3 flex flex-col gap-4">
                {/* First panel - Edit and Language */}
                <div className="bg-blue-50 rounded-lg border border-blackblack p-2">
                  <button className="!bg-blue-50 w-full text-left flex items-center px-4 py-2 text-blue-500 hover:bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit staff information
                  </button>
                  <div className="w-full flex justify-between items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      Language
                    </div>
                    <span className="text-blue-500">English</span>
                  </div>
                </div>

                {/* Second panel - View shift, Change password, Logout */}
                <div className="bg-blue-50 rounded-lg border border-black p-2">
                  <button className="!bg-blue-50 w-full text-left flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    View shift
                  </button>
                  <button className="!bg-blue-50 w-full text-left flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change username & password
                  </button>
                  <button className="!bg-blue-50 w-full text-left flex items-center px-4 py-2 text-red-500 hover:bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>

              {/* Right column - User information */}
              <div className="w-2/3">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 gap-3">
                    <p className="text-sm">
                      <strong>Full Name:</strong> Tran Thi My Dung
                    </p>
                    <p className="text-sm">
                      <strong>Staff Id:</strong> 1
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong> MXDX1234@gmail.com
                    </p>
                    <p className="text-sm">
                      <strong>Position:</strong> Service Staff
                    </p>
                    <p className="text-sm">
                      <strong>Full - Time | </strong> +84 987654321
                    </p>
                    <p className="text-sm">
                      <strong>Salary:</strong> $390.08
                    </p>
                    <p className="text-sm">
                      <strong>Address:</strong> 448 Le Van Viet Street, District 9
                    </p>
                    <p className="text-sm">
                      <strong>Working shift:</strong>
                    </p>
                    <p className="text-sm text-center">
                      Shift 01: 7:00am - 13:00pm
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffInformation;